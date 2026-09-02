import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  catchError, combineLatest, defer, of, shareReplay,
} from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectHasEnclosureSupport,
  selectProductType,
} from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private truenasConnectService = inject(TruenasConnectService);
  private entitlements = inject(EntitlementsService);

  /** `failover.licensed` is the runtime truth here; the `HA` entitlement is the narrower
   * license-type question. Left as-is until the two are reconciled. */
  hasFailover$ = this.store$.select(selectIsHaLicensed);

  /** Not an entitlement — iX hardware detection. */
  hasEnclosure$ = this.store$.select(selectHasEnclosureSupport);

  /** The licence may permit Fibre Channel on a box with no FC hardware, so only the
   * entitlement half moved. */
  hasFibreChannel$ = combineLatest([
    this.entitlements.entitled$(EntitlementFeature.FibreChannel),
    this.api.call('fc.capable'),
  ]).pipe(
    map(([hasFibreChannel, isFcCapable]) => hasFibreChannel && isFcCapable),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  hasVms$ = this.entitlements.entitled$(EntitlementFeature.Vms);

  hasApps$ = this.entitlements.entitled$(EntitlementFeature.Apps);

  hasDedup$ = this.entitlements.entitled$(EntitlementFeature.Dedup);

  readonly hasKmip$ = this.entitlements.entitled$(EntitlementFeature.Kmip);

  readonly hasSed$ = this.entitlements.entitled$(EntitlementFeature.Sed);

  /**
   * Mirrors `showSedCard` in `AdvancedSettingsComponent` — the SED card is
   * rendered when either the system is licensed as Enterprise (which always
   * exposes SED config) or a global SED password has already been set.
   *
   * Short-circuits on Enterprise so we don't burn a backend call for the
   * password-set check when the answer is already true. `catchError` falls
   * back to `false` so a transient API failure hides SED entries rather than
   * tearing down the search filter chain. `refCount: true` ensures the
   * fallback isn't permanently cached: the next subscribe after the chain
   * goes idle re-runs `defer` and gets a fresh answer once the backend is
   * healthy again.
   */
  readonly hasSedFeature$ = defer(() => this.entitlements.entitled$(EntitlementFeature.Sed).pipe(
    first(),
    switchMap((isEntitled) => (
      isEntitled
        ? of(true)
        : this.api.call('system.advanced.sed_global_password_is_set').pipe(map(Boolean))
    )),
  )).pipe(
    catchError(() => of(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

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
  readonly shouldShowContainers$ = this.entitlements.entitled$(EntitlementFeature.Containers);

  /**
   * Not migrated: the `WEBSHARE` entitlement grants only when the licence carries the key,
   * while this shows WebShare precisely when the system is *not* Enterprise. NAS-143012
   * resolves it in favour of the entitlement.
   *
   * WebShare (a TrueNAS Connect feature) is not offered on Enterprise systems.
   * Deliberately waits for the product type to load instead of using `selectIsEnterprise`
   * (which reads `false` while the product type is still null), so consumers — the shares
   * dashboard card and the webshare route guard — never act on a transient "not Enterprise".
   */
  readonly shouldShowWebshare$ = this.store$.pipe(
    selectNotNull(selectProductType),
    map((productType) => productType !== ProductType.Enterprise),
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
