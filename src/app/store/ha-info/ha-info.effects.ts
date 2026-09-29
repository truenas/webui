import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import {
  filter, map, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
  private api = inject(TypedApiService);
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
            map((reasons) => this.toHaStatusAction(reasons)),
          );
        }),
      );
    }),
  ));

  // The decision is made inside the `switchMap` so a later correction to unlicensed (the `HA`
  // entitlement overriding the sign-in seed) tears the subscription down instead of skipping it.
  subscribeToHa = createEffect(() => this.actions$.pipe(
    ofType(failoverLicensedStatusLoaded),
    switchMap(({ isHaLicensed }) => {
      if (!isHaLicensed) {
        return EMPTY;
      }

      return this.api.subscribe('failover.disabled.reasons').pipe(
        filter((event) => event.msg === 'changed'),
        map((event) => this.toHaStatusAction(event.fields.disabled_reasons)),
      );
    }),
  ));

  private toHaStatusAction(reasons: string[]): ReturnType<typeof haStatusLoaded> {
    // Middleware types the reasons as plain strings; `FailoverDisabledReason` holds the same values.
    const failoverDisabledReasons = reasons as FailoverDisabledReason[];
    const haEnabled = failoverDisabledReasons.length === 0;
    this.window.localStorage.setItem('ha_status', haEnabled.toString());

    return haStatusLoaded({ haStatus: { hasHa: haEnabled, reasons: failoverDisabledReasons } });
  }
}
