import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementsService } from 'app/services/entitlements.service';

// `entitled$` only emits once entitlements are known, so the guard never redirects on a
// transient denial while they are still loading.
export const webShareGuard: CanActivateFn = () => {
  const entitlements = inject(EntitlementsService);
  const router = inject(Router);

  return entitlements.entitled$(EntitlementFeature.Webshare).pipe(
    take(1),
    map((isEntitled) => isEntitled || router.createUrlTree(['/sharing'])),
  );
};
