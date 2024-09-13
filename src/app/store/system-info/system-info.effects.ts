import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import {
  catchError, map, mergeMap,
} from 'rxjs/operators';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  ixHardwareLoaded,
  productTypeLoaded,
  systemInfoLoaded, systemInfoUpdated,
} from 'app/store/system-info/system-info.actions';

@Injectable()
export class SystemInfoEffects {
  loadSystemInfo = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, systemInfoUpdated),
    mergeMap(() => {
      return this.ws.call('system.info').pipe(
        map((systemInfo) => systemInfoLoaded({ systemInfo })),
        catchError((error) => {
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
      return this.ws.call('truenas.is_ix_hardware').pipe(
        map((isIxHardware) => ixHardwareLoaded({ isIxHardware })),
        catchError((error) => {
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
      return this.ws.call('system.product_type').pipe(
        map((productType) => productTypeLoaded({ productType })),
        catchError((error) => {
          console.error(error);
          return of(productTypeLoaded({ productType: null }));
        }),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
  ) { }
}
