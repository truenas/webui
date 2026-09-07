import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, UsersState } from 'app/pages/credentials/users/store/user.reducer';

export const userStateKey = 'users';
export const selectUserState = createFeatureSelector<UsersState>(userStateKey);

const { selectAll } = adapter.getSelectors();

export const selectUsers = createSelector(
  selectUserState,
  selectAll,
);
