import { createFeatureSelector, createSelector } from '@ngrx/store';
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
