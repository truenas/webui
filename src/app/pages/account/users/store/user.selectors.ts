import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, UsersState } from 'app/pages/account/users/store/user.reducer';

export const userStateKey = 'users';
export const selectUserState = createFeatureSelector<UsersState>(userStateKey);

export interface UserSlice {
  [userStateKey]: UsersState;
}

const { selectTotal } = adapter.getSelectors();

export const selectUsers = createSelector(
  selectUserState,
  (state) => state.ids.map((id) => ({
    id,
    ...state.entities[id],
    full_name: state.entities[id]?.full_name?.replace(/,*$/, ''),
  })),
);

export const selectUsersTotal = createSelector(
  selectUserState,
  selectTotal,
);
