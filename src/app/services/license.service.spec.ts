import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { HardwareType } from 'app/enums/hardware-type.enum';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { LicenseService } from 'app/services/license.service';
import { selectEntitlementFacts } from 'app/store/system-info/system-info.selectors';

describe('LicenseService', () => {
  function setup(hardwareType: HardwareType | null, isWebshareEntitled: boolean): LicenseService {
    TestBed.configureTestingModule({
      providers: [
        LicenseService,
        mockProvider(TruenasConnectService, { config$: of(null) }),
        mockProvider(EntitlementsService, {
          entitled$: (feature: EntitlementFeature) => of(feature === EntitlementFeature.Webshare && isWebshareEntitled),
        }),
        provideMockStore({
          selectors: [{
            selector: selectEntitlementFacts,
            value: hardwareType ? { hardware_type: hardwareType, license_type: null } : null,
          }],
        }),
      ],
    });
    return TestBed.inject(LicenseService);
  }

  describe('shouldShowWebshare$', () => {
    it('emits true off TrueNAS appliance hardware even without the WEBSHARE entitlement', async () => {
      const service = setup(HardwareType.Community, false);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(true);
    });

    it('emits true on TrueNAS appliance hardware with the WEBSHARE entitlement', async () => {
      const service = setup(HardwareType.Truenas, true);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(true);
    });

    it('emits false on TrueNAS appliance hardware without the WEBSHARE entitlement', async () => {
      const service = setup(HardwareType.Truenas, false);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(false);
    });

    it('does not emit until the entitlement facts have loaded', () => {
      const service = setup(null, true);

      let hasEmitted = false;
      service.shouldShowWebshare$.subscribe(() => {
        hasEmitted = true;
      });

      expect(hasEmitted).toBe(false);
    });
  });
});
