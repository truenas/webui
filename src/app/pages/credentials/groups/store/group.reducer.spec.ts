import { Group } from 'app/interfaces/group.interface';
import { groupsLoaded } from 'app/pages/credentials/groups/store/group.actions';
import { groupReducer, groupsInitialState } from 'app/pages/credentials/groups/store/group.reducer';

describe('groupReducer', () => {
  it('stores loaded groups by id, sorted by name', () => {
    const groups = [
      { id: 2, group: 'wheel' },
      { id: 1, group: 'admins' },
    ] as Group[];

    const state = groupReducer({ ...groupsInitialState, isLoading: true }, groupsLoaded({ groups }));

    expect(state.isLoading).toBe(false);
    expect(state.ids).toEqual([1, 2]);
    expect(state.entities[2]).toEqual(groups[0]);
  });
});
