import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, shareReplay, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectHasEnclosureSupport,
  selectIsEnterprise,
  selectLicenseFeatures,
  selectSystemInfo,
  waitForSystemInfo,
} from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);

  hasFailover$ = this.store$.select(selectIsHaLicensed);
  hasEnclosure$ = this.store$.select(selectHasEnclosureSupport);
  hasFibreChannel$ = combineLatest([
    this.store$.pipe(
      waitForSystemInfo,
      map((systemInfo) => systemInfo.license?.features?.includes(LicenseFeature.FibreChannel)),
    ),
    this.api.call('fc.capable'),
  ]).pipe(
    map(([hasFibreChannel, isFcCapable]) => hasFibreChannel && isFcCapable),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

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

  readonly hasKmip$ = this.store$.select(selectIsEnterprise);

  readonly shouldShowContainers$ = combineLatest([
    this.store$.select(selectIsEnterprise),
    this.store$.select(selectLicenseFeatures),
  ]).pipe(map((
    [isEnterprise, licenseFeatures]: [boolean, LicenseFeature[]],
  ) => !isEnterprise || licenseFeatures.includes(LicenseFeature.Jails)));

  private readonly truenasConnectConfig$ = this.api.call('tn_connect.config').pipe(
    catchError((error: unknown) => {
      console.warn('Failed to check TrueNAS Connect status. Assuming not configured.', error);
      return of({ enabled: false, status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /**
   * Check if the system is configured with TrueNAS Connect.
   * This is used to determine if WebShare and other TrueNAS Connect features are available.
   * We check for `status === Configured` rather than just `enabled` because:
   * - `enabled: true` only means TrueNAS Connect is turned on
   * - The system might still be in intermediate states (e.g., CertGenerationInProgress)
   * - Only `status === Configured` means TrueNAS Connect is fully operational
   */
  readonly hasTruenasConnect$ = this.truenasConnectConfig$.pipe(
    map((connectConfig) => connectConfig.status === TruenasConnectStatus.Configured),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
