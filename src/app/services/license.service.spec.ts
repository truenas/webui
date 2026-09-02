import { Injector, runInInjectionContext } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
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

  describe('hasSed$', () => {
    /**
     * `DiskListComponent` reads this under `toSignal(..., { requireSync: true })` at field
     * init and freezes its column array, so an observable that defers until entitlements
     * load throws there and permanently drops the SED column. Asserted here because the
     * disk-list spec stubs `LicenseService` wholesale and cannot catch it.
     */
    it('emits synchronously so requireSync consumers can read it at field init', () => {
      const service = setup(ProductType.Enterprise);
      const injector = TestBed.inject(Injector);

      expect(() => runInInjectionContext(injector, () => {
        toSignal(service.hasSed$, { requireSync: true });
      })).not.toThrow();
    });
  });
});
