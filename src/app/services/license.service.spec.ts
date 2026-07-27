import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { LicenseService } from 'app/services/license.service';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

describe('LicenseService', () => {
  function setup(productType: ProductType | null): LicenseService {
    TestBed.configureTestingModule({
      providers: [
        LicenseService,
        mockProvider(ApiService),
        mockProvider(TruenasConnectService, {
          config$: of(null),
        }),
        provideMockStore({
          selectors: [
            { selector: selectProductType, value: productType },
          ],
        }),
      ],
    });
    return TestBed.inject(LicenseService);
  }

  describe('shouldShowWebshare$', () => {
    it('emits true on non-enterprise systems', async () => {
      const service = setup(ProductType.CommunityEdition);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(true);
    });

    it('emits false on enterprise systems', async () => {
      const service = setup(ProductType.Enterprise);

      await expect(firstValueFrom(service.shouldShowWebshare$)).resolves.toBe(false);
    });

    it('does not emit until the product type has loaded', () => {
      const service = setup(null);

      let hasEmitted = false;
      service.shouldShowWebshare$.subscribe(() => {
        hasEmitted = true;
      });

      expect(hasEmitted).toBe(false);
    });
  });
});
