import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { HardwareDiskEncryptionComponent } from './hardware-disk-encryption.component';

describe('HardwareDiskEncryptionComponent', () => {
  let spectator: Spectator<HardwareDiskEncryptionComponent>;
  let store$: MockStore;

  const createComponent = createComponentFactory({
    component: HardwareDiskEncryptionComponent,
    imports: [
      HasRoleDirective,
    ],
    providers: [
      mockApi([
        mockCall('disk.query', [{ passwd: '' } as Disk]),
        mockCall('system.advanced.sed_global_password_is_set', false),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(false),
        })),
      }),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: false,
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        topologyDisk: {
          disk: 'sda',
        } as TopologyDisk,
      },
    });
    store$ = spectator.inject(MockStore);
  });

  it('loads and shows whether password is set for the current disk', () => {
    expect(spectator.inject(ApiService).call)
      .toHaveBeenCalledWith('disk.query', [[['devname', '=', 'sda']], { extra: { passwords: true } }]);

    const detailsItem = spectator.query(byText('SED Password:', { exact: true }))!;
    expect(detailsItem.nextElementSibling).toHaveText('Password is not set');

    expect(spectator.query(byText('Manage SED Password'))).toBeNull();
  });

  it('loads and shows whether SED password is set globally', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.sed_global_password_is_set');

    const detailsItem = spectator.query(byText('Global SED Password:', { exact: true }))!;
    expect(detailsItem.nextElementSibling).toHaveText('Password is not set');

    expect(spectator.query(byText('Manage Global SED Password'))).toBeNull();
  });

  describe('enterprise', () => {
    beforeEach(() => {
      store$.overrideSelector(selectIsEnterprise, true);
      store$.refreshState();
      spectator.detectChanges();
    });

    it('shows a link to manage SED password and opens dialog', () => {
      const manageSedPassword = spectator.query(byText('Manage SED Password'));
      spectator.click(manageSedPassword);
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManageDiskSedDialogComponent, { data: 'sda' });
    });

    it('shows a link to manage global SED password', () => {
      const manageGlobalSedPassword = spectator.query(byText('Manage Global SED Password'));
      expect(manageGlobalSedPassword).toHaveAttribute('href', '/system/advanced');
    });
  });
});
