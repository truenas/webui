import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  catchError, defer, of, shareReplay,
} from 'rxjs';
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
} from 'app/store/system-info/system-info.selectors';

/**
 * These two SED observables stay on the licence-feature check for now. New-pool SED
 * provisioning already gates on the `SED` entitlement; the remaining SED surfaces (status
 * column, advanced-settings card, search) move together once the 25.x → 26 upgrade path
 * for existing SED pools is settled on the middleware side. That is a question about the
 * gate NAS-138051 introduced, not about the entitlement engine.
 *
 * `hasSed$` must also stay synchronous. `DiskListComponent` reads it at field init under
 * `requireSync`, and builds its column array once without ever recomputing it, so an
 * observable that defers until entitlements load would throw there.
 */
const selectHasSedFeature = selectHasLicenseFeature(LicenseFeature.Sed);

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private truenasConnectService = inject(TruenasConnectService);

  /** `failover.licensed` is the runtime truth here; the `HA` entitlement is the narrower
   * license-type question. Left as-is until the two are reconciled. */
  hasFailover$ = this.store$.select(selectIsHaLicensed);

  /** Not an entitlement — iX hardware detection. */
  hasEnclosure$ = this.store$.select(selectHasEnclosureSupport);

  readonly hasSed$ = this.store$.select(selectHasSedFeature);

  /**
   * Not migrated to the `STIG` entitlement: `fips_available` reports firmware capability,
   * a different question from whether the licence permits STIG. The card likely needs both.
   *
   * True when the backend reports FIPS hardware support — that's
   * the same condition `AdvancedSettingsComponent.isSystemLicensed` uses to
   * render the card. `catchError` falls back to `false` so a transient
   * `fips_available` failure hides the System Security entries rather than
   * crashing the search filter chain. `refCount: true` ensures the fallback
   * isn't permanently cached.
   */
  readonly hasSystemSecurity$ = defer(() => this.api.call('system.security.info.fips_available')).pipe(
    map(Boolean),
    catchError(() => of(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Previously borrowed the APPS feature. Same decision today, but keyed on what it means. */
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
