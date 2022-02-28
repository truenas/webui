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
  builtinUsersToggled, localizationFormSubmitted,
  noPreferencesFound, oneTimeBuiltinGroupsMessageShown, oneTimeBuiltinUsersMessageShown,
  preferencesFormSubmitted,
  preferencesLoaded, preferencesReset, preferredColumnsUpdated,
  themeNotFound,
} from 'app/store/preferences/preferences.actions';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { sidenavUpdated } from 'app/store/topbar/topbar.actions';

@Injectable()
export class PreferencesEffects {
  loadPreferences$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('user.query', [[['id', '=', rootUserId]]]).pipe(
        map(([user]) => {
          const preferences = user.attributes.preferences;

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
      preferencesFormSubmitted,
      preferencesReset,
      preferredColumnsUpdated,
      oneTimeBuiltinUsersMessageShown,
      builtinUsersToggled,
      oneTimeBuiltinGroupsMessageShown,
      builtinGroupsToggled,
      localizationFormSubmitted,
    ),
    withLatestFrom(this.store$.select(selectPreferencesState)),
    switchMap(([_, state]) => {
      if (!state.areLoaded) {
        return throwError('Attempting to save user preferences before they were loaded.');
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
