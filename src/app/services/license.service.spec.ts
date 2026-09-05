import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { LicenseService } from 'app/services/license.service';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

describe('LicenseService', () => {
  function setup(productType: ProductType | null, isWebshareEntitled: boolean): LicenseService {
    TestBed.configureTestingModule({
      providers: [
        LicenseService,
        mockProvider(TruenasConnectService, { config$: of(null) }),
        mockProvider(EntitlementsService, {
          entitled$: (feature: EntitlementFeature) => of(feature === EntitlementFeature.Webshare && isWebshareEntitled),
        }),
        provideMockStore({
          selectors: [{ selector: selectProductType, value: productType }],
        }),
      ],
    });
    return TestBed.inject(LicenseService);
  }

  describe('shouldShowWebshare$', () => {
    it('emits true on non-enterprise systems even without the WEBSHARE entitlement', async () => {
      const service = setup(ProductType.CommunityEdition, false);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(true);
    });

    it('emits true on enterprise systems with the WEBSHARE entitlement', async () => {
      const service = setup(ProductType.Enterprise, true);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(true);
    });

    it('emits false on enterprise systems without the WEBSHARE entitlement', async () => {
      const service = setup(ProductType.Enterprise, false);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(false);
    });

    it('does not emit until the product type has loaded', () => {
      const service = setup(null, true);

      let hasEmitted = false;
      service.shouldShowWebshare$.subscribe(() => {
        hasEmitted = true;
      });

      expect(hasEmitted).toBe(false);
    });
  });
});
