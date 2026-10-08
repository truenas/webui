import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { snapshotsLoaded } from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import {
  snapshotReducer, snapshotsInitialState,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';

describe('snapshotReducer', () => {
  it('stores loaded snapshots by their full name, sorted by snapshot name', () => {
    const snapshots = [
      { name: 'tank@second', snapshot_name: 'second' },
      { name: 'tank@first', snapshot_name: 'first' },
    ] as ZfsSnapshot[];

    const state = snapshotReducer({ ...snapshotsInitialState, isLoading: true }, snapshotsLoaded({ snapshots }));

    expect(state.isLoading).toBe(false);
    expect(state.ids).toEqual(['tank@first', 'tank@second']);
    expect(state.entities['tank@second']).toEqual(snapshots[0]);
  });
});
