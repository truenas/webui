import { Injectable, Type } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemGeneralService } from 'app/services';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';
import { combineLatest, Observable } from 'rxjs';
import { map, } from 'rxjs/operators';

// TODO: Nuke me?
/**
 * Requires Enterprise systems to have license.
 * Non-Enterprise systems are always allowed.
 */
export class EnterpriseLicenseGuard {
  static requireOnEnterprise(feature: LicenseFeature): Type<unknown> {
    @Injectable({
      providedIn: 'root',
    })
    class EnterpriseLicenseCheck implements CanActivate {
      constructor(
        private systemGeneralService: SystemGeneralService,
        private store$: Store<AppState>,
        private router: Router,
      ) {}

      canActivate(): Observable<boolean | UrlTree> {
        return combineLatest([
          this.isEnterprise(),
          this.hasLicense(feature),
        ])
          .pipe(map(([isEnterprise, hasLicense]) => {
            const canActivate = !isEnterprise || hasLicense;
            if (!canActivate) {
              return this.router.parseUrl('/dashboard');
            }
            return true;
          }));
      }

      private isEnterprise(): Observable<boolean> {
        return this.systemGeneralService.getProductType$.pipe(
          map((productType) => productType === ProductType.ScaleEnterprise),
        );
      }

      private hasLicense(feature: LicenseFeature): Observable<boolean> {
        return this.store$.pipe(
          waitForSystemInfo,
          map((systemInfo) => systemInfo.license?.features?.includes(feature)),
        );
      }
    }

    return EnterpriseLicenseCheck;
  }
}

