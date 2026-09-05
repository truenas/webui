import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { LicenseService } from 'app/services/license.service';

// `shouldShowWebshare$` only emits once the product type and entitlements are known, so the
// guard never redirects on a transient denial while they are still loading.
export const webShareGuard: CanActivateFn = () => {
  const license = inject(LicenseService);
  const router = inject(Router);

  return license.shouldShowWebshare$.pipe(
    take(1),
    map((shouldShow) => shouldShow || router.createUrlTree(['/sharing'])),
  );
};
