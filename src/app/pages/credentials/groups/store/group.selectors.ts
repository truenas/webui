import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { Group } from 'app/interfaces/group.interface';
import { adapter, GroupsState } from 'app/pages/credentials/groups/store/group.reducer';

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

export const selectGroup = (id: number): MemoizedSelector<object, Group> => createSelector(
  selectGroups,
  (groups) => groups.find((group) => group.id === id),
);
