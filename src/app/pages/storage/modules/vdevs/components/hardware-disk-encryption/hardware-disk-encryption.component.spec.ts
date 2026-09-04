import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ManageDiskSedDialog,
} from 'app/pages/storage/modules/vdevs/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
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
      mockProvider(NavigateAndHighlightService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(false),
        })),
      }),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectEntitlements,
          value: {
            [EntitlementFeature.Sed]: {
              entitled: false,
              reason: EntitlementReason.NoLicense,
              message: 'This system is not licensed to use the SED feature.',
            },
          },
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

  describe('denied the SED entitlement', () => {
    beforeEach(() => {
      // SED denied => hasSedSupport() is false.
      store$.overrideSelector(selectEntitlements, {
        [EntitlementFeature.Sed]: {
          entitled: false,
          reason: EntitlementReason.NoLicense,
          message: 'This system is not licensed to use the SED feature.',
        },
      });
      store$.refreshState();
      spectator.detectChanges();
    });

    it('checks no hardware disk encryption support', () => {
      expect(spectator.query('.mat-card')).not.toExist();
    });
  });

  describe('entitled to SED', () => {
    beforeEach(() => {
      store$.overrideSelector(selectEntitlements, {});
      store$.refreshState();
      spectator.detectChanges();
    });

    it('loads and shows whether password is set for the current disk', () => {
      expect(spectator.inject(ApiService).call)
        .toHaveBeenCalledWith('disk.query', [[['devname', '=', 'sda']], { extra: { passwords: true } }]);

      const detailsItem = spectator.query(byText('SED Password:', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Password is not set');
    });

    it('loads and shows whether SED password is set globally', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.sed_global_password_is_set');

      const detailsItem = spectator.query(byText('Global SED Password:', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Password is not set');
    });

    it('shows a link to manage SED password and opens dialog', () => {
      const manageSedPassword = spectator.query(byText('Manage SED Password'))!;
      spectator.click(manageSedPassword);
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManageDiskSedDialog, { data: 'sda' });
    });

    it('shows a link to manage global SED password', () => {
      const manageGlobalSedPassword = spectator.query(byText('Manage Global SED Password'))!;
      spectator.click(manageGlobalSedPassword);
      expect(spectator.inject(NavigateAndHighlightService).navigateAndHighlight)
        .toHaveBeenCalledWith(['/system', 'advanced'], 'sed-card');
    });
  });
});
