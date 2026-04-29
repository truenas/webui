import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, forkJoin, of } from 'rxjs';
import {
  catchError, map, mergeMap,
} from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { ContractType, License } from 'app/interfaces/system-info.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  ixHardwareLoaded,
  productTypeLoaded,
  systemInfoLoaded, systemInfoUpdated,
} from 'app/store/system-info/system-info.actions';

const knownContractTypes: ReadonlySet<string> = new Set(Object.values(ContractType));

/**
 * Defensively uppercase `contract_type` so downstream `getLabelForContractType`
 * lookups hit the `ContractType` enum keys regardless of how middleware emits
 * the casing. Unknown values are passed through as the uppercased string and a
 * warning is logged so they surface during testing — the label helper has its
 * own raw-string fallback for display.
 */
function normalizeLicense(license: License | null): License | null {
  if (!license?.contract_type) {
    return license;
  }

  const upper = license.contract_type.toUpperCase();
  if (!knownContractTypes.has(upper)) {
    console.warn(`Unknown license.contract_type "${license.contract_type}" — falling back to raw value.`);
  }

  return { ...license, contract_type: upper as ContractType };
}

@Injectable()
export class SystemInfoEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

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
          systemInfo: { ...systemInfo, license: normalizeLicense(license) },
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
      return this.api.call('truenas.is_ix_hardware').pipe(
        map((isIxHardware) => ixHardwareLoaded({ isIxHardware })),
        catchError((error: unknown) => {
          // TODO: Show error message to user?
          console.error(error);
          return of(ixHardwareLoaded({ isIxHardware: false }));
        }),
      );
    }),
  ));

  loadProductType = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.api.call('system.product_type').pipe(
        map((productType) => productTypeLoaded({ productType })),
        catchError((error: unknown) => {
          console.error(error);
          return of(productTypeLoaded({ productType: ProductType.CommunityEdition }));
        }),
      );
    }),
  ));
}
