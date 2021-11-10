import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { User } from 'app/interfaces/user.interface';
import { WebSocketService } from 'app/services';
import {
  UserLoadAction, UserActionType, UserLoadSuccessAction, UserLoadFailAction,
} from 'app/store/actions/user.actions';

@Injectable()
export class UserEffects {
  constructor(private ws: WebSocketService, private actions$: Actions) { }

  loadUsers$ = createEffect(() => {
    return this.actions$
      .pipe(ofType<UserLoadAction>(UserActionType.Loading),
        map((action) => action.payload),
        switchMap(() => {
          return this.ws.call('user.query').pipe(
            map((response: User[]) => new UserLoadSuccessAction(response)),
            catchError((error) => of(new UserLoadFailAction(error))),
          );
        }));
  });
}
