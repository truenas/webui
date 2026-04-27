import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { License } from 'app/interfaces/system-info.interface';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectHasEnclosureSupport,
  selectIsEnterprise,
  selectLicense,
} from 'app/store/system-info/system-info.selectors';

function licenseHasFeature(license: License | null | undefined, feature: LicenseFeature): boolean {
  return license?.features.some((entry) => entry.name === feature) ?? false;
}

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
    this.store$.select(selectLicense).pipe(
      map((license) => licenseHasFeature(license, LicenseFeature.FibreChannel)),
    ),
    this.api.call('fc.capable'),
  ]).pipe(
    map(([hasFibreChannel, isFcCapable]) => hasFibreChannel && isFcCapable),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  hasVms$ = combineLatest([
    this.store$.select(selectLicense),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([license, isEnterprise]) => !isEnterprise || licenseHasFeature(license, LicenseFeature.Vm)),
  );

  hasApps$ = combineLatest([
    this.store$.select(selectLicense),
    this.store$.select(selectIsEnterprise),
  ]).pipe(
    map(([license, isEnterprise]) => !isEnterprise || licenseHasFeature(license, LicenseFeature.Apps)),
  );

  readonly hasKmip$ = this.store$.select(selectIsEnterprise);

  readonly hasSed$ = this.store$.select(selectLicense).pipe(
    map((license) => licenseHasFeature(license, LicenseFeature.Sed)),
  );

  readonly shouldShowContainers$ = combineLatest([
    this.store$.select(selectIsEnterprise),
    this.store$.select(selectLicense),
  ]).pipe(
    map(([isEnterprise, license]) => !isEnterprise || licenseHasFeature(license, LicenseFeature.Apps)),
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
