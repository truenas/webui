import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  userPageEntered,
  userRemoved,
  usersLoaded,
  usersNotLoaded,
} from 'app/pages/credentials/users/store/user.actions';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  // Note: This effect loads users into NgRx store for use by user-form.component.ts
  // The main users list (all-users.component.ts) uses its own UsersDataProvider
  // with component-level filtering via getDefaultUserTypeFilters()
  loadUsers$ = createEffect(() => this.actions$.pipe(
    ofType(userPageEntered),
    switchMap(() => {
      return this.api.call('user.query').pipe(
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
}
