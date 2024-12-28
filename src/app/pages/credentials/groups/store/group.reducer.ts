import { createEntityAdapter, EntityState } from '@ngrx/entity';
import {
  createReducer, on,
} from '@ngrx/store';
import { Group } from 'app/interfaces/group.interface';
import {
  groupAdded, groupChanged,
  groupPageEntered,
  groupRemoved,
  groupsLoaded,
  groupsNotLoaded,
} from 'app/pages/credentials/groups/store/group.actions';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';

export interface GroupsState extends EntityState<Group> {
  isLoading: boolean;
  error: string | null;
}

export const adapter = createEntityAdapter<Group>({
  selectId: (group) => group.id,
  sortComparer: (a, b) => a.group.localeCompare(b.group),
});

export const groupsInitialState: GroupsState = adapter.getInitialState({
  isLoading: false,
  error: null,
});

export const groupReducer = createReducer(
  groupsInitialState,

  on(builtinGroupsToggled, (state) => ({ ...state, isLoading: true, error: null })),
  on(groupPageEntered, (state) => ({ ...state, isLoading: true, error: null })),
  on(groupsLoaded, (state, { groups }) => adapter.setAll(groups, { ...state, isLoading: false })),
  on(groupsNotLoaded, (state, { error }) => ({ ...state, error, isLoading: false })),

  on(groupAdded, (state, { group }) => adapter.addOne(group, state)),
  on(groupChanged, (state, { group }) => adapter.updateOne({
    id: group.id,
    changes: group,
  }, state)),
  on(groupRemoved, (state, { id }) => adapter.removeOne(id, state)),
);
