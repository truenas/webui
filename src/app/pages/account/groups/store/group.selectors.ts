import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, GroupsState } from 'app/pages/account/groups/store/group.reducer';

export const groupStateKey = 'groups';
export const selectGroupState = createFeatureSelector<GroupsState>(groupStateKey);

export interface GroupSlice {
  [groupStateKey]: GroupsState;
}

const { selectAll, selectTotal } = adapter.getSelectors();

export const selectGroups = createSelector(
  selectGroupState,
  selectAll,
);

export const selectGroupsTotal = createSelector(
  selectGroupState,
  selectTotal,
);
