import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';
import {
  failoverLicensedStatusLoaded,
  haSettingsUpdated,
  haStatusLoaded,
} from './ha-info.actions';
import { selectIsHaLicensed } from './ha-info.selectors';

@Injectable()
export class HaInfoEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private window = inject<Window>(WINDOW);
  private store$ = inject<Store<AppState>>(Store);

  loadFailoverLicensedStatus = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.api.call('failover.licensed').pipe(
        map((isHaLicensed) => {
          return failoverLicensedStatusLoaded({ isHaLicensed });
        }),
      );
    }),
  ));

  loadHaStatus = createEffect(() => this.actions$.pipe(
    ofType(haSettingsUpdated, passiveNodeReplaced, failoverLicensedStatusLoaded),
    switchMap(() => {
      return this.store$.select(selectIsHaLicensed).pipe(
        switchMap((isHaLicensed) => {
          if (!isHaLicensed) {
            return EMPTY;
          }

          return this.api.call('failover.disabled.reasons').pipe(
            map((failoverDisabledReasons) => {
              const haEnabled = failoverDisabledReasons.length === 0;
              this.window.localStorage.setItem('ha_status', haEnabled.toString());

              return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
            }),
          );
        }),
      );
    }),
  ));

  subscribeToHa = createEffect(() => this.actions$.pipe(
    ofType(failoverLicensedStatusLoaded),
    filter(({ isHaLicensed }) => isHaLicensed),
    switchMap(() => {
      return this.api.subscribe('failover.disabled.reasons').pipe(
        map((event) => {
          const failoverDisabledReasons = event.fields?.disabled_reasons;
          const haEnabled = failoverDisabledReasons.length === 0;
          this.window.localStorage.setItem('ha_status', haEnabled.toString());

          return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
        }),
      );
    }),
  ));
}
