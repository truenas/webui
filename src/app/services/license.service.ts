import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectHasEnclosureSupport,
  selectIsEnterprise,
  selectSystemInfo,
} from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  hasFailover$ = this.store$.select(selectIsHaLicensed);
  hasEnclosure$ = this.store$.select(selectHasEnclosureSupport);
  hasVms$ = combineLatest([
    this.store$.select(selectSystemInfo),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([systemInfo, isEnterprise]) => {
      if (!isEnterprise) {
        return true;
      }

      return Boolean(systemInfo?.license?.features?.includes(LicenseFeature.Vm));
    }),
  );

  hasApps$ = combineLatest([
    this.store$.select(selectSystemInfo),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([systemInfo, isEnterprise]) => {
      if (!isEnterprise) {
        return true;
      }

      return Boolean(systemInfo?.license?.features?.includes(LicenseFeature.Jails));
    }),
  );

  hasKmip$ = this.store$.select(selectIsEnterprise);

  constructor(
    private store$: Store<AppState>,
  ) {}
}
