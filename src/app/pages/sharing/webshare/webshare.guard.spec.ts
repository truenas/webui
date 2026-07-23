import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree,
} from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { webShareGuard } from 'app/pages/sharing/webshare/webshare.guard';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

describe('webShareGuard', () => {
  function setup(productType: ProductType): Promise<boolean | UrlTree> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectProductType, value: productType },
          ],
        }),
      ],
    });

    const result$ = TestBed.runInInjectionContext(() => {
      return webShareGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });
    return firstValueFrom(result$ as Observable<boolean | UrlTree>);
  }

  it('allows activation on non-enterprise systems', async () => {
    await expect(setup(ProductType.CommunityEdition)).resolves.toBe(true);
  });

  it('redirects to the shares dashboard on enterprise systems', async () => {
    const result = await setup(ProductType.Enterprise);

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/sharing');
  });
});
