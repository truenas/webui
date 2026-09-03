import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import {
  filter, map, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { entitlementsLoaded } from 'app/store/entitlements/entitlements.actions';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';
import {
  failoverLicensedStatusLoaded,
  haSettingsUpdated,
  haStatusLoaded,
} from './ha-info.actions';
import { selectHaInfoState, selectIsHaLicensed } from './ha-info.selectors';

@Injectable()
export class HaInfoEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private window = inject<Window>(WINDOW);
  private store$ = inject<Store<AppState>>(Store);

  /**
   * The `HA` entitlement is the source of truth once signed in. Sign-in seeds the state from
   * `failover.licensed` (the same check server-side, callable without a role); this only
   * overrides it when the engine actually reports the key, so engine-less boxes keep that seed.
   */
  syncHaLicenseFromEntitlements = createEffect(() => this.actions$.pipe(
    ofType(entitlementsLoaded),
    map(({ entitlements }) => entitlements[EntitlementFeature.Ha]?.entitled),
    filter((isHaLicensed): isHaLicensed is boolean => isHaLicensed !== undefined),
    withLatestFrom(this.store$.select(selectHaInfoState)),
    filter(([isHaLicensed, haInfoState]) => haInfoState.isHaLicensed !== isHaLicensed),
    map(([isHaLicensed]) => failoverLicensedStatusLoaded({ isHaLicensed })),
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
