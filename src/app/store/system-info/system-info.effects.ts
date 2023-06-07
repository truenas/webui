import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import {
  catchError, map, mergeMap, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { WebSocketService } from 'app/services';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  failoverLicensedStatusLoaded,
  haSettingsUpdated,
  haStatusLoaded,
  ixHardwareLoaded,
  loadHaStatus,
  passiveNodeReplaced,
  systemFeaturesLoaded,
  systemHaCapabilityLoaded,
  systemInfoLoaded,
  upgradePendingStateLoaded,
} from 'app/store/system-info/system-info.actions';
import { selectIsHaLicensed } from 'app/store/system-info/system-info.selectors';

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
    ofType(loadHaStatus, haSettingsUpdated, passiveNodeReplaced, adminUiInitialized),
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
    ofType(loadHaStatus),
    mergeMap(() => {
      return this.ws.subscribe('failover.disabled.reasons').pipe(
        map((event) => {
          const failoverDisabledReasons = event.fields?.disabled_reasons;
          const haEnabled = failoverDisabledReasons.length === 0;
          this.window.sessionStorage.setItem('ha_status', haEnabled.toString());

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

      if (isHa && shouldCheckForPendingUpgrade) {
        return this.ws.call('failover.upgrade_pending').pipe(
          map((isUpgradePending) => upgradePendingStateLoaded({ isUpgradePending })),
        );
      }

      return EMPTY;
    }),
  ));

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

  loadIsSystemHaCapable = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('system.is_ha_capable').pipe(
        map((isSystemHaCapable: boolean) => systemHaCapabilityLoaded({ isSystemHaCapable })),
      );
    }),
  ));

  loadIsIxHardware = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('system.is_ix_hardware').pipe(
        map((isIxHardware: boolean) => ixHardwareLoaded({ isIxHardware })),
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
