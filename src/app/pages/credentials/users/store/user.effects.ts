import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { omit } from 'lodash-es';
import { of } from 'rxjs';
import {
  catchError, map, switchMap,
} from 'rxjs/operators';
import { toUser } from 'app/interfaces/user.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  userAdded,
  userChanged,
  userPageEntered,
  userRemoved,
  usersLoaded,
  usersNotLoaded,
} from 'app/pages/credentials/users/store/user.actions';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private api = inject(TypedApiService);
  private translate = inject(TranslateService);

  // Note: This effect loads users into NgRx store for use by user-form.component.ts
  // The main users list (all-users.component.ts) uses its own UsersDataProvider
  // with component-level filtering via getDefaultUserTypeFilters()
  loadUsers$ = createEffect(() => this.actions$.pipe(
    ofType(userPageEntered),
    switchMap(() => {
      return this.api.query('user.query').pipe(
        map((users) => usersLoaded({ users: users.map(toUser) })),
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

  // Follows changes made anywhere — this tab, another admin, the CLI — so the list the form validates
  // new names against does not miss a user made since the page loaded it. Middleware sends `added`
  // and `changed` with what `user.create` and `user.update` returned, the entry plus the `password`
  // given in the call, which is left out of the store.
  subscribeToChanges$ = createEffect(() => this.actions$.pipe(
    ofType(usersLoaded),
    switchMap(() => {
      return this.api.subscribe('user.query').pipe(
        map((event) => {
          if (event.msg === 'removed') {
            return userRemoved({ id: event.id as number });
          }
          const fields = omit(event.fields, 'password');
          const user = toUser({ ...fields, id: event.id } as WebUiQueryEntity<'user.query'>);
          return event.msg === 'added' ? userAdded({ user }) : userChanged({ user });
        }),
      );
    }),
  ));
}
