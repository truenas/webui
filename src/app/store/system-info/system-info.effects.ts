import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { CallResponse } from '@truenas/api-client';
import { environment } from 'environments/environment';
import {
  combineLatest, defer, EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, distinctUntilChanged, map, mergeMap,
} from 'rxjs/operators';
import { HardwareType } from 'app/enums/hardware-type.enum';
import { ContractType, License, SystemInfo } from 'app/interfaces/system-info.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { selectEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  entitlementFactsLoaded,
  ixHardwareLoaded,
  systemInfoLoaded, systemInfoUpdated,
} from 'app/store/system-info/system-info.actions';

type SystemInfoResult = CallResponse<WebUiApiDirectory, 'system.info'>;
type LicenseInfo = CallResponse<WebUiApiDirectory, 'truenas.license.info'>;

const knownContractTypes: ReadonlySet<string> = new Set(Object.values(ContractType));

/**
 * Defensively uppercase `contract_type` so downstream `getLabelForContractType`
 * lookups hit the `ContractType` enum keys regardless of how middleware emits
 * the casing. Unknown values are passed through as the uppercased string and a
 * warning is logged so they surface during testing — the label helper has its
 * own raw-string fallback for display.
 */
function normalizeLicense(wireLicense: LicenseInfo | null): License | null {
  // Middleware types the dates as strings, but they arrive as `ApiDate` envelopes, and it leaves
  // `type` and the feature names as open strings the UI reads through its enums.
  const license = wireLicense as unknown as License | null;
  if (!license?.contract_type) {
    return license;
  }

  const upper = license.contract_type.toUpperCase();
  if (!knownContractTypes.has(upper)) {
    console.warn(`Unknown license.contract_type "${license.contract_type}" — falling back to raw value.`);
  }

  return { ...license, contract_type: upper as ContractType };
}

/**
 * Middleware types the timestamps as strings, but they arrive as `ApiTimestamp` envelopes; `license`
 * is filled from `truenas.license.info` rather than read from this answer.
 */
function toSystemInfo(systemInfo: SystemInfoResult, license: License | null): SystemInfo {
  return { ...systemInfo, license } as unknown as SystemInfo;
}

@Injectable()
export class SystemInfoEffects {
  private actions$ = inject(Actions);
  private api = inject(TypedApiService);
  private store$ = inject<Store<AppState>>(Store);

  /**
   * The debug panel's enclosure mock stands in for iX hardware on a dev box. Its mocks only
   * intercept `ApiService` calls, so the typed `truenas.is_ix_hardware` answer is overridden here
   * instead. The debug panel's state only exists when the panel is enabled (see `main.ts`).
   */
  private isEnclosureMockEnabled$: Observable<boolean> = defer(() => {
    if (!environment.debugPanel?.enabled) {
      return of(false);
    }

    return this.store$.select(selectEnclosureMockConfig).pipe(
      map((config) => config.enabled && config.controllerModel !== null),
    );
  });

  loadSystemInfo = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, systemInfoUpdated),
    mergeMap(() => {
      return forkJoin({
        systemInfo: this.api.call('system.info'),
        // A license fetch failure must not take the dashboard down. Recover to
        // null so `systemInfoLoaded` still fires with the rest of the payload.
        license: this.api.call('truenas.license.info').pipe(
          catchError((error: unknown) => {
            console.error(error);
            return of(null);
          }),
        ),
      }).pipe(
        map(({ systemInfo, license }) => systemInfoLoaded({
          systemInfo: toSystemInfo(systemInfo, normalizeLicense(license)),
        })),
        catchError((error: unknown) => {
          // TODO: Basically a fatal error. Handle it.
          console.error(error);
          return EMPTY;
        }),
      );
    }),
  ));

  loadIsIxHardware = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      const isIxHardware$ = this.api.call('truenas.is_ix_hardware').pipe(
        catchError((error: unknown) => {
          // TODO: Show error message to user?
          console.error(error);
          return of(false);
        }),
      );

      return combineLatest([isIxHardware$, this.isEnclosureMockEnabled$]).pipe(
        map(([isIxHardware, isEnclosureMocked]) => isIxHardware || isEnclosureMocked),
        distinctUntilChanged(),
        map((isIxHardware) => ixHardwareLoaded({ isIxHardware })),
      );
    }),
  ));

  loadEntitlementFacts = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.api.call('truenas.entitlements.facts').pipe(
        map((entitlementFacts) => entitlementFactsLoaded({ entitlementFacts })),
        catchError((error: unknown) => {
          console.error(error);
          return of(entitlementFactsLoaded({
            entitlementFacts: { hardware_type: HardwareType.Community, license_type: null },
          }));
        }),
      );
    }),
  ));
}
