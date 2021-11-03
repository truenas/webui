import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { User } from 'app/interfaces/user.interface';
import { UserService } from 'app/services';
import {
  UserLoadAction, UserActionType, UserLoadSuccessAction, UserLoadFailAction,
} from 'app/store/actions/user.actions';

@Injectable()
export class UserEffects {
  constructor(private service: UserService, private actions$: Actions) { }

  loadUsers$ = createEffect(() => {
    return this.actions$
      .pipe(ofType<UserLoadAction>(UserActionType.Loading),
        map((action) => action.payload),
        switchMap((params: { search: string; offset: number }) => {
          return this.service.userQueryDSCache(params.search, params.offset).pipe(
            map((response: User[]) => new UserLoadSuccessAction(response)),
            catchError((error) => of(new UserLoadFailAction(error))),
          );
        }));
  });
}
