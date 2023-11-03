import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { User } from 'app/interfaces/user.interface';
import { adapter, UsersState } from 'app/pages/account/users/store/user.reducer';

export const userStateKey = 'users';
export const selectUserState = createFeatureSelector<UsersState>(userStateKey);

export interface UserSlice {
  [userStateKey]: UsersState;
}

const { selectAll, selectTotal } = adapter.getSelectors();

export const selectUsers = createSelector(
  selectUserState,
  selectAll,
);

export const selectUsersTotal = createSelector(
  selectUserState,
  selectTotal,
);

export const selectUser = (id: number): MemoizedSelector<object, User> => createSelector(
  selectUsers,
  (users) => users.find((user) => user.id === id),
);
