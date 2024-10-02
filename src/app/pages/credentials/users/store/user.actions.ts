import { createAction, props } from '@ngrx/store';
import { User } from 'app/interfaces/user.interface';

export const userPageEntered = createAction('[Users API] Load');

export const usersLoaded = createAction('[Users API] Loaded', props<{ users: User[] }>());
export const usersNotLoaded = createAction('[Users API] Not Loaded', props<{ error: string }>());

export const userAdded = createAction('[Users API] User Added', props<{ user: User }>());
export const userChanged = createAction('[Users API] User Changed', props<{ user: User }>());
export const userRemoved = createAction('[Users API] User Removed', props<{ id: number }>());
