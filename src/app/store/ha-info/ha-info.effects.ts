import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { WebSocketService } from 'app/services';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';
import {
  failoverLicensedStatusLoaded,
  haSettingsUpdated,
  haStatusLoaded,
  upgradePendingStateLoaded,
} from './ha-info.actions';

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
          this.window.localStorage.setItem('ha_status', haEnabled.toString());

          return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
        }),
      );
    }),
  ));

  loadUpgradePendingState = createEffect(() => this.actions$.pipe(
    ofType(haStatusLoaded),
    withLatestFrom(this.store$.select(selectIsHaLicensed)),
    mergeMap(([{ haStatus }, isHa]) => {
      const shouldCheckForPendingUpgrade = (haStatus.hasHa && haStatus.reasons.length === 0)
        || (haStatus.reasons.length === 1 && haStatus.reasons[0] === FailoverDisabledReason.MismatchVersions);

      if (!isHa || !shouldCheckForPendingUpgrade) {
        return EMPTY;
      }

      return this.ws.call('failover.upgrade_pending').pipe(
        map((isUpgradePending) => upgradePendingStateLoaded({ isUpgradePending })),
      );
    }),
  ));

  subscribeToHa = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.subscribe('failover.disabled.reasons').pipe(
        map((event) => {
          const failoverDisabledReasons = event.fields?.disabled_reasons;
          const haEnabled = failoverDisabledReasons.length === 0;
          this.window.localStorage.setItem('ha_status', haEnabled.toString());

          return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
        }),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) { }
}
