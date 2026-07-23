import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { AppState } from 'app/store';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

// WebShare (a TrueNAS Connect feature) is not offered on Enterprise systems.
export const webShareGuard: CanActivateFn = () => {
  const store$ = inject<Store<AppState>>(Store);
  const router = inject(Router);

  return store$.pipe(
    selectNotNull(selectProductType),
    take(1),
    map((productType) => (productType === ProductType.Enterprise ? router.createUrlTree(['/sharing']) : true)),
  );
};
