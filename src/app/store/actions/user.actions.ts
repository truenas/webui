/* eslint-disable max-classes-per-file */

import { Action } from '@ngrx/store';
import { User } from 'app/interfaces/user.interface';

export enum UserActionType {
  Loading = '[User] Loading',
  LoadSuccess = '[User] LoadSuccess',
  LoadFailure = '[User] LoadFailure',
}

export class UserLoadAction implements Action {
  readonly type = UserActionType.Loading;
}

export class UserLoadSuccessAction implements Action {
  readonly type = UserActionType.LoadSuccess;
  constructor(public payload: User[]) {}
}

export class UserLoadFailAction implements Action {
  readonly type = UserActionType.LoadFailure;
  constructor(public error: boolean) {}
}

export type UserAction = UserLoadAction | UserLoadSuccessAction | UserLoadFailAction;
