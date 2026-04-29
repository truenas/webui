import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
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
  private truenasConnectService = inject(TruenasConnectService);

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

  readonly hasSed$ = this.store$.select(selectLicenseFeatures).pipe(
    map((licenseFeatures) => licenseFeatures?.includes(LicenseFeature.Sed) ?? false),
  );

  /**
   * Mirrors `showSedCard` in `AdvancedSettingsComponent` — the SED card is
   * rendered when either the system is licensed as Enterprise (which always
   * exposes SED config) or a global SED password has already been set.
   */
  readonly hasSedFeature$ = combineLatest([
    this.store$.select(selectIsEnterprise),
    this.api.call('system.advanced.sed_global_password_is_set'),
  ]).pipe(
    map(([isEnterprise, hasGlobalEncryption]) => Boolean(isEnterprise) || Boolean(hasGlobalEncryption)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /**
   * Mirrors `isSystemLicensed` in `AdvancedSettingsComponent` — the System
   * Security card (FIPS / STIG / password policy) is rendered only on
   * systems where FIPS hardware support is available.
   */
  readonly hasSystemSecurityFeature$ = this.api.call('system.security.info.fips_available').pipe(
    map(Boolean),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly shouldShowContainers$ = combineLatest([
    this.store$.select(selectIsEnterprise),
    this.store$.select(selectLicenseFeatures),
  ]).pipe(map((
    [isEnterprise, licenseFeatures],
  ) => !isEnterprise || licenseFeatures?.includes(LicenseFeature.Jails)));

  /**
   * Check if the system is configured with TrueNAS Connect.
   * This is used to determine if WebShare and other TrueNAS Connect features are available.
   * We check for `status === Configured` rather than just `enabled` because:
   * - `enabled: true` only means TrueNAS Connect is turned on
   * - The system might still be in intermediate states (e.g., CertGenerationInProgress)
   * - Only `status === Configured` means TrueNAS Connect is fully operational
   */
  readonly hasTruenasConnect$ = this.truenasConnectService.config$.pipe(
    map((config) => config?.status === TruenasConnectStatus.Configured),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
