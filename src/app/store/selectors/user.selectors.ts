import { createFeatureSelector, createSelector } from '@ngrx/store';
import { userAdapter, UserState } from 'app/store/states/user.state';

export const {
  selectIds: _selectUserDataIds,
  selectEntities: _selectUserEntities,
  selectAll: _selectAllUser,
  selectTotal: _selectUserTotal,
} = userAdapter.getSelectors();

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectUserIds = createSelector(
  selectUserState,
  _selectUserDataIds,
);

export const selectUserEntities = createSelector(
  selectUserState,
  _selectUserEntities,
);

export const selectAllUser = createSelector(
  selectUserState,
  _selectAllUser,
);

export const selectUserError = createSelector(
  selectUserState,
  (state: UserState): boolean => state.error,
);

export const selectUserLoading = createSelector(
  selectUserState,
  (state: UserState): boolean => state.loading,
);

export const selectUserTotal = createSelector(
  selectUserState,
  (state: UserState): number => state.total,
);
