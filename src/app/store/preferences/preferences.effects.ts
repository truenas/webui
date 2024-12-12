import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, throwError } from 'rxjs';
import {
  catchError, filter, map, mergeMap, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { AuthService } from 'app/services/auth/auth.service';
import { ApiService } from 'app/services/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { AppState } from 'app/store/index';
import {
  autoRefreshReportsToggled,
  builtinGroupsToggled,
  builtinUsersToggled, guiFormSubmitted, lifetimeTokenUpdated, localizationFormSubmitted,
  preferencesLoaded, preferredColumnsUpdated,
  shownNewIndicatorKeysUpdated,
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
      return this.authService.user$.pipe(
        filter(Boolean),
        map((user) => {
          const preferences = user.attributes?.preferences;
          const dashboardState = user.attributes?.dashState;

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
        catchError((error: unknown) => {
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
      shownNewIndicatorKeysUpdated,
      builtinGroupsToggled,
      localizationFormSubmitted,
      lifetimeTokenUpdated,
      guiFormSubmitted,
      updateRebootAfterManualUpdate,
      autoRefreshReportsToggled,
    ),
    withLatestFrom(this.store$.select(selectPreferencesState)),
    switchMap(([, state]) => {
      if (!state.areLoaded) {
        return throwError(() => new Error('Attempting to save user preferences before they were loaded.'));
      }

      return this.api.call('auth.set_attribute', ['preferences', state.preferences]);
    }),
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private api: ApiService,
    private store$: Store<AppState>,
    private authService: AuthService,
  ) {}
}
