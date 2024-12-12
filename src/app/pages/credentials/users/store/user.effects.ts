import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import {
  userPageEntered,
  userRemoved,
  usersLoaded,
  usersNotLoaded,
} from 'app/pages/credentials/users/store/user.actions';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { builtinUsersToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@Injectable()
export class UserEffects {
  loadUsers$ = createEffect(() => this.actions$.pipe(
    ofType(userPageEntered, builtinUsersToggled),
    switchMap(() => this.store$.pipe(waitForPreferences)),
    switchMap((preferences) => {
      let params: QueryParams<User> = [];
      if (preferences.hideBuiltinUsers) {
        params = [[['OR', [['builtin', '=', false], ['username', '=', 'root']]]]] as QueryParams<User>;
      }
      return this.api.call('user.query', params).pipe(
        map((users) => usersLoaded({ users })),
        catchError((error: unknown) => {
          console.error(error);
          // TODO: See if it would make sense to parse middleware error.
          return of(usersNotLoaded({
            error: this.translate.instant('Users could not be loaded'),
          }));
        }),
      );
    }),
  ));

  // userAdded() and userChanged() are dispatched from the User Form

  subscribeToRemoval$ = createEffect(() => this.actions$.pipe(
    ofType(usersLoaded),
    switchMap(() => {
      return this.api.subscribe('user.query').pipe(
        filter((event) => event.msg === CollectionChangeType.Removed),
        map((event) => userRemoved({ id: event.id as number })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private api: ApiService,
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {}
}
