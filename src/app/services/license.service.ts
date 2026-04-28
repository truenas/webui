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
  selectHasLicenseFeature,
  selectIsEnterprise,
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
    this.store$.select(selectHasLicenseFeature(LicenseFeature.FibreChannel)),
    this.api.call('fc.capable'),
  ]).pipe(
    map(([hasFibreChannel, isFcCapable]) => hasFibreChannel && isFcCapable),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  hasVms$ = combineLatest([
    this.store$.select(selectHasLicenseFeature(LicenseFeature.Vm)),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([hasVm, isEnterprise]) => !isEnterprise || hasVm),
  );

  hasApps$ = combineLatest([
    this.store$.select(selectHasLicenseFeature(LicenseFeature.Apps)),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([hasApps, isEnterprise]) => !isEnterprise || hasApps),
  );

  readonly hasKmip$ = this.store$.select(selectIsEnterprise);

  readonly hasSed$ = this.store$.select(selectHasLicenseFeature(LicenseFeature.Sed));

  readonly shouldShowContainers$ = combineLatest([
    this.store$.select(selectIsEnterprise),
    this.store$.select(selectHasLicenseFeature(LicenseFeature.Apps)),
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
