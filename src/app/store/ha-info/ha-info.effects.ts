import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { WebSocketService } from 'app/services';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';
import { failoverLicensedStatusLoaded, haSettingsUpdated, haStatusLoaded } from './ha-info.actions';

@Injectable()
export class HaInfoEffects {
  loadFailoverLicensedStatus = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('failover.licensed').pipe(
        map((isHaLicensed) => {
          return failoverLicensedStatusLoaded({ isHaLicensed });
        }),
      );
    }),
  ));

  loadHaStatus = createEffect(() => this.actions$.pipe(
    ofType(haSettingsUpdated, passiveNodeReplaced, adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('failover.disabled.reasons').pipe(
        map((failoverDisabledReasons) => {
          const haEnabled = failoverDisabledReasons.length === 0;
          this.window.sessionStorage.setItem('ha_status', haEnabled.toString());

          return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
        }),
      );
    }),
  ));

  subscribeToHa = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.newSub('failover.disabled.reasons').pipe(
        map((event) => {
          const failoverDisabledReasons = event.fields?.disabled_reasons;
          const haEnabled = failoverDisabledReasons.length === 0;
          this.window.sessionStorage.setItem('ha_status', haEnabled.toString());

          return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
        }),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) { }
}
