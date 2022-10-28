import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import {
  catchError, map, mergeMap, switchMap,
} from 'rxjs/operators';
import { HaStatusText } from 'app/enums/ha-status-text.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { WebSocketService } from 'app/services';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  haSettingsUpdated,
  haStatusLoaded,
  loadHaStatus, passiveNodeReplaced,
  systemFeaturesLoaded,
  systemInfoLoaded,
} from 'app/store/system-info/system-info.actions';

@Injectable()
export class SystemInfoEffects {
  loadSystemInfo = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
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

  loadSystemFeatures = createEffect(() => this.actions$.pipe(
    ofType(systemInfoLoaded),
    switchMap(({ systemInfo }) => {
      this.window.sessionStorage.setItem('systemInfoLoaded', Date.now().toString());
      const features: SystemFeatures = {
        HA: false,
        enclosure: false,
      };
      const profile = { ...systemInfo };

      if (!profile.system_product) {
        // Stick with defaults if value is null
        return of(systemFeaturesLoaded({ systemFeatures: features }));
      }

      if (profile.system_product.includes('FREENAS-MINI-3.0') || profile.system_product.includes('TRUENAS-')) {
        features.enclosure = true;
      }

      // HIGH AVAILABILITY SUPPORT
      if ((profile.license && profile.license.system_serial_ha) || profile.system_product === 'BHYVE') {
        features.HA = true;
        return of(
          systemFeaturesLoaded({ systemFeatures: features }),
          loadHaStatus(),
        );
      }
      return of(systemFeaturesLoaded({ systemFeatures: features }));
    }),
  ));

  loadHaStatus = createEffect(() => this.actions$.pipe(
    ofType(loadHaStatus, haSettingsUpdated, passiveNodeReplaced),
    mergeMap(() => {
      return this.ws.call('failover.disabled.reasons').pipe(
        map((failoverDisabledReasons) => {
          const haEnabled = failoverDisabledReasons.length === 0;

          const enabledText = failoverDisabledReasons.length === 0 ? HaStatusText.HaEnabled : HaStatusText.HaDisabled;

          this.window.sessionStorage.setItem('ha_status', haEnabled.toString());
          return haStatusLoaded({ haStatus: { status: enabledText, reasons: failoverDisabledReasons } });
        }),
      );
    }),
  ));

  subscribeToHa = createEffect(() => this.actions$.pipe(
    ofType(loadHaStatus),
    mergeMap(() => {
      return this.ws.subscribe('failover.disabled.reasons').pipe(
        map((event) => {
          const failoverDisabledReasons = event.fields?.disabled_reasons;
          const haEnabled = failoverDisabledReasons.length === 0;
          const enabledText = failoverDisabledReasons.length === 0 ? HaStatusText.HaEnabled : HaStatusText.HaDisabled;
          this.window.sessionStorage.setItem('ha_status', haEnabled.toString());
          return haStatusLoaded({ haStatus: { status: enabledText, reasons: failoverDisabledReasons } });
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
