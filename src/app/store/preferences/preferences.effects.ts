import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, throwError } from 'rxjs';
import {
  catchError, map, mergeMap, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { rootUserId } from 'app/constants/root-user-id.contant';
import { WebSocketService } from 'app/services';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { AppState } from 'app/store/index';
import {
  builtinGroupsToggled,
  builtinUsersToggled, guiFormSubmitted, localizationFormSubmitted,
  preferencesLoaded, preferredColumnsUpdated,
  themeNotFound,
  updateRebootAfterManualUpdate,
} from 'app/store/preferences/preferences.actions';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { sidenavUpdated } from 'app/store/topbar/topbar.actions';
import {
  snapshotExtraColumnsToggled, dashboardStateLoaded, noPreferencesFound, noDashboardStateFound,
} from './preferences.actions';

@Injectable()
export class PreferencesEffects {
  loadPreferences$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('user.query', [[['id', '=', rootUserId]]]).pipe(
        map(([user]) => {
          const preferences = user.attributes.preferences;
          const dashboardState = user.attributes.dashState;

          if (dashboardState) {
            this.store$.dispatch(dashboardStateLoaded({ dashboardState }));
          } else {
            this.store$.dispatch(noDashboardStateFound());
          }

          if (!preferences) {
            return noPreferencesFound();
          }

          return preferencesLoaded({ preferences });
        }),
        catchError((error) => {
          // TODO: Basically a fatal error. Handle it.
          console.error(error);
          return EMPTY;
        }),
      );
    }),
  ));

  saveUpdatedPreferences$ = createEffect(() => this.actions$.pipe(
    ofType(
      sidenavUpdated,
      themeNotFound,
      preferredColumnsUpdated,
      builtinUsersToggled,
      snapshotExtraColumnsToggled,
      builtinGroupsToggled,
      localizationFormSubmitted,
      guiFormSubmitted,
      updateRebootAfterManualUpdate,
    ),
    withLatestFrom(this.store$.select(selectPreferencesState)),
    switchMap(([, state]) => {
      if (!state.areLoaded) {
        return throwError(() => new Error('Attempting to save user preferences before they were loaded.'));
      }

      return this.ws.call('user.set_attribute', [rootUserId, 'preferences', state.preferences]);
    }),
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private store$: Store<AppState>,
  ) {}
}
