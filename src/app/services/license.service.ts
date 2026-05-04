import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, defer, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectHasEnclosureSupport,
  selectHasLicenseFeature,
  selectIsEnterprise,
} from 'app/store/system-info/system-info.selectors';

// Hoist parameterized selector instances so consumers share memoization across
// subscriptions (each call to `selectHasLicenseFeature` builds a new selector).
const selectHasAppsFeature = selectHasLicenseFeature(LicenseFeature.Apps);
const selectHasVmsFeature = selectHasLicenseFeature(LicenseFeature.Vms);
const selectHasSedFeature = selectHasLicenseFeature(LicenseFeature.Sed);
const selectHasFibreChannelFeature = selectHasLicenseFeature(LicenseFeature.FibreChannel);

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
    this.store$.select(selectHasFibreChannelFeature),
    this.api.call('fc.capable'),
  ]).pipe(
    map(([hasFibreChannel, isFcCapable]) => hasFibreChannel && isFcCapable),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  hasVms$ = combineLatest([
    this.store$.select(selectHasVmsFeature),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([hasVms, isEnterprise]) => !isEnterprise || hasVms),
  );

  hasApps$ = combineLatest([
    this.store$.select(selectHasAppsFeature),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([hasApps, isEnterprise]) => !isEnterprise || hasApps),
  );

  readonly hasKmip$ = this.store$.select(selectIsEnterprise);

  readonly hasSed$ = this.store$.select(selectHasSedFeature);

  /**
   * Mirrors `showSedCard` in `AdvancedSettingsComponent` — the SED card is
   * rendered when either the system is licensed as Enterprise (which always
   * exposes SED config) or a global SED password has already been set.
   */
  readonly hasSedFeature$ = defer(() => combineLatest([
    this.store$.select(selectIsEnterprise),
    this.api.call('system.advanced.sed_global_password_is_set'),
  ])).pipe(
    map(([isEnterprise, hasGlobalEncryption]) => Boolean(isEnterprise) || Boolean(hasGlobalEncryption)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /**
   * Mirrors `isSystemLicensed` in `AdvancedSettingsComponent`: true when
   * FIPS hardware support is reported by the backend. Gates visibility of
   * the System Security card (FIPS / STIG / password policy).
   */
  readonly hasFipsHardware$ = defer(() => this.api.call('system.security.info.fips_available')).pipe(
    map(Boolean),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly shouldShowContainers$ = combineLatest([
    this.store$.select(selectIsEnterprise),
    this.store$.select(selectHasAppsFeature),
  ]).pipe(
    map(([isEnterprise, hasApps]) => !isEnterprise || hasApps),
  );

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
