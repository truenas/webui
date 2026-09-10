import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  catchError, combineLatest, defer, of, shareReplay,
} from 'rxjs';
import { map } from 'rxjs/operators';
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

  /** Seeded by `failover.licensed` at sign-in, then kept in step with the `HA` entitlement. */
  hasFailover$ = this.store$.select(selectIsHaLicensed);

  /** Not an entitlement — iX hardware detection. */
  hasEnclosure$ = this.store$.select(selectHasEnclosureSupport);

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

  /**
   * WebShare (a TrueNAS Connect feature) is offered on every non-Enterprise system. On Enterprise
   * it is available only when the licence carries the `WEBSHARE` entitlement.
   *
   * Waits for both the product type and the entitlements to load, so the shares dashboard card
   * and the webshare route guard never act on a transient answer while either is still unknown.
   */
  readonly shouldShowWebshare$ = combineLatest([
    this.store$.pipe(selectNotNull(selectProductType)),
    this.entitlements.entitled$(EntitlementFeature.Webshare),
  ]).pipe(
    map(([productType, isEntitled]) => isEntitled || productType !== ProductType.Enterprise),
    shareReplay({ bufferSize: 1, refCount: true }),
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
