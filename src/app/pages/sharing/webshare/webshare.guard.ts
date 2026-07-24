import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { LicenseService } from 'app/services/license.service';

// `shouldShowWebshare$` only emits once the product type is known, so the guard
// never allows activation on a transient "not Enterprise" while it's still loading.
export const webShareGuard: CanActivateFn = () => {
  const license = inject(LicenseService);
  const router = inject(Router);

  return license.shouldShowWebshare$.pipe(
    take(1),
    map((shouldShowWebshare) => shouldShowWebshare || router.createUrlTree(['/sharing'])),
  );
};
