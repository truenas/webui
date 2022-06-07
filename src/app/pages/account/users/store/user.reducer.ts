import { createEntityAdapter, EntityState } from '@ngrx/entity';
import {
  createReducer, on,
} from '@ngrx/store';
import { User } from 'app/interfaces/user.interface';
import {
  userPageEntered, usersLoaded, usersNotLoaded, userAdded, userChanged, userRemoved,
} from 'app/pages/account/users/store/user.actions';
import { builtinUsersToggled } from 'app/store/preferences/preferences.actions';

export interface UsersState extends EntityState<User> {
  isLoading: boolean;
  error: string;
}

export const adapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.username.localeCompare(b.username),
});

export const usersInitialState = adapter.getInitialState({
  isLoading: false,
  error: null,
});

export const userReducer = createReducer(
  usersInitialState,

  on(builtinUsersToggled, (state) => ({ ...state, isLoading: true, error: null })),
  on(userPageEntered, (state) => ({ ...state, isLoading: true, error: null })),
  on(usersLoaded, (state, { users }) => adapter.setAll(users, { ...state, isLoading: false })),
  on(usersNotLoaded, (state, { error }) => ({ ...state, error, isLoading: false })),

  on(userAdded, (state, { user }) => adapter.addOne(user, state)),
  on(userChanged, (state, { user }) => adapter.updateOne({
    id: user.id,
    changes: user,
  }, state)),
  on(userRemoved, (state, { id }) => adapter.removeOne(id, state)),
);
