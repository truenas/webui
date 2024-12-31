import { createEntityAdapter, EntityState } from '@ngrx/entity';
import {
  createReducer, on,
} from '@ngrx/store';
import { User } from 'app/interfaces/user.interface';
import {
  userAdded, userChanged,
  userPageEntered, userRemoved,
  usersLoaded,
  usersNotLoaded,
} from 'app/pages/credentials/users/store/user.actions';
import { builtinUsersToggled } from 'app/store/preferences/preferences.actions';

export interface UsersState extends EntityState<User> {
  isLoading: boolean;
  error: string | null;
}

export const adapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.username.localeCompare(b.username),
});

export const usersInitialState: UsersState = adapter.getInitialState({
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
