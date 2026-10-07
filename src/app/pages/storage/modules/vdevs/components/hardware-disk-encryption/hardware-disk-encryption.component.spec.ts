import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnCardComponent, TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedQuery('disk.query', [{ passwd: '', sed: true, sed_status: SedStatus.Unlocked } as WebUiQueryEntity<'disk.query'>]),
        mockTypedCall('system.advanced.sed_global_password_is_set', false),
      ]),
      mockProvider(NavigateAndHighlightService),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(false),
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
      expect(spectator.query(TnCardComponent)).toBeNull();
    });

    it('does not query the disk while the card is hidden', () => {
      expect(spectator.inject(TypedApiService).query).not.toHaveBeenCalled();
    });
  });

  describe('entitled to SED', () => {
    beforeEach(async () => {
      store$.overrideSelector(selectEntitlements, {});
      store$.refreshState();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
    });

    it('shows the SED status of the current disk', () => {
      const detailsItem = spectator.query(byText('Self-Encrypting Drive (SED):', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Unlocked');
    });

    it('loads and shows whether password is set for the current disk', () => {
      expect(spectator.inject(TypedApiService).query)
        .toHaveBeenCalledWith('disk.query', [['devname', '=', 'sda']], { extra: { passwords: true, sed_status: true } });

      const detailsItem = spectator.query(byText('SED Password:', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Password is not set');
    });

    it('loads and shows whether SED password is set globally', () => {
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('system.advanced.sed_global_password_is_set');

      const detailsItem = spectator.query(byText('Global SED Password:', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Password is not set');
    });

    it('shows a link to manage SED password and opens dialog', () => {
      const manageSedPassword = spectator.query(byText('Manage SED Password'))!;
      spectator.click(manageSedPassword);
      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ManageDiskSedDialog, { data: 'sda' });
    });

    it('reloads the disk after the SED password dialog saves', () => {
      const api = spectator.inject(TypedApiService);
      jest.mocked(spectator.inject(TnDialog).open).mockReturnValueOnce({ closed: of(true) } as ReturnType<TnDialog['open']>);
      jest.mocked(api.query).mockClear();

      spectator.click(spectator.query(byText('Manage SED Password'))!);

      expect(api.query).toHaveBeenCalledWith('disk.query', [['devname', '=', 'sda']], expect.anything());
    });

    it('shows a link to manage global SED password', () => {
      const manageGlobalSedPassword = spectator.query(byText('Manage Global SED Password'))!;
      spectator.click(manageGlobalSedPassword);
      expect(spectator.inject(NavigateAndHighlightService).navigateAndHighlight)
        .toHaveBeenCalledWith(['/system', 'advanced'], 'sed-card', { inset: false });
    });

    // Both links moved to the library's test-id directive, and e2e locators still key on these
    // exact values — so the resolved id is asserted here, on links located by their text the
    // same way the tests above locate them.
    it('keeps the legacy link test ids after moving to the library test-id directive', () => {
      expect(spectator.query(byText('Manage SED Password')))
        .toHaveAttribute('data-test', 'link-manage-sed-password');
      expect(spectator.query(byText('Manage Global SED Password')))
        .toHaveAttribute('data-test', 'link-manage-global-sed-password');
    });
  });

  describe('entitled to SED, disk is not SED capable', () => {
    beforeEach(async () => {
      spectator.inject(MockTypedApiService).mockQuery('disk.query', [{ passwd: '', sed: false } as WebUiQueryEntity<'disk.query'>]);
      spectator.setInput('topologyDisk', { disk: 'sdb' } as TopologyDisk);
      store$.overrideSelector(selectEntitlements, {});
      store$.refreshState();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
    });

    it('shows the disk as unsupported and hides the password rows', () => {
      const detailsItem = spectator.query(byText('Self-Encrypting Drive (SED):', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Unsupported');

      expect(spectator.query(byText('SED Password:', { exact: true }))).toBeNull();
      expect(spectator.query(byText('Global SED Password:', { exact: true }))).toBeNull();
      expect(spectator.query(byText('Manage SED Password'))).toBeNull();
    });
  });

  describe('entitled to SED, disk is not found', () => {
    beforeEach(async () => {
      spectator.inject(MockTypedApiService).mockQuery('disk.query', []);
      spectator.setInput('topologyDisk', { disk: 'sdz' } as TopologyDisk);
      store$.overrideSelector(selectEntitlements, {});
      store$.refreshState();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
    });

    it('shows the SED status as unknown and hides the password rows', () => {
      const detailsItem = spectator.query(byText('Self-Encrypting Drive (SED):', { exact: true }))!;
      expect(detailsItem.nextElementSibling).toHaveText('Unknown');
      expect(spectator.query(byText('SED Password:', { exact: true }))).toBeNull();
    });
  });
});
