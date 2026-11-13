import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  catchError, combineLatest, defer, of, shareReplay,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { HardwareType } from 'app/enums/hardware-type.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectEntitlementFacts,
  selectHasEnclosureSupport,
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
   * Middleware's `fc.capable`: the licence allows Fibre Channel and an FC HBA is present.
   * Errors map to `false`, and `refCount: true` keeps that from sticking.
   */
  readonly isFcCapable$ = defer(() => this.api.call('fc.capable')).pipe(
    catchError(() => of(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Gates every Fibre Channel control. The entitlement alone is not enough: a licensed system with no
   * FC HBA (a VM, say) is entitled but cannot do Fibre Channel. Emits nothing until entitlements load.
   */
  readonly hasFibreChannel$ = this.entitlements.entitled$(EntitlementFeature.FibreChannel).pipe(
    switchMap((isEntitled) => (isEntitled ? this.isFcCapable$ : of(false))),
  );

  /**
   * Whether the hardware supports FIPS, the condition `AdvancedSettingsComponent.isSystemLicensed` uses.
   * Not the `STIG` entitlement, which answers whether the licence permits it; the card likely needs both.
   * Errors map to `false` so the search filter chain survives, and `refCount: true` keeps that from sticking.
   */
  readonly hasSystemSecurity$ = defer(() => this.api.call('system.security.info.fips_available')).pipe(
    map(Boolean),
    catchError(() => of(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * WebShare (a TrueNAS Connect feature) is offered on every system that isn't TrueNAS appliance hardware.
   * On appliances it is available only when the licence carries the `WEBSHARE` entitlement.
   *
   * Waits for both the entitlement facts and the entitlements to load, so the shares dashboard card
   * and the webshare route guard never act on a transient answer while either is still unknown.
   */
  readonly shouldShowWebshare$ = combineLatest([
    this.store$.pipe(selectNotNull(selectEntitlementFacts)),
    this.entitlements.entitled$(EntitlementFeature.Webshare),
  ]).pipe(
    map(([facts, isEntitled]) => isEntitled || facts.hardware_type !== HardwareType.Truenas),
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
