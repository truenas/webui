import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import {
  snapshotAdded, snapshotChanged, snapshotsLoaded, snapshotsRefreshed,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import {
  snapshotReducer, snapshotsInitialState,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';

describe('snapshotReducer', () => {
  const snapshots = [
    { name: 'tank@second', snapshot_name: 'second' },
    { name: 'tank@first', snapshot_name: 'first' },
  ] as ZfsSnapshot[];

  it('stores loaded snapshots by their full name, sorted by snapshot name', () => {
    const state = snapshotReducer({ ...snapshotsInitialState, isLoading: true }, snapshotsLoaded({ snapshots }));

    expect(state.isLoading).toBe(false);
    expect(state.ids).toEqual(['tank@first', 'tank@second']);
    expect(state.entities['tank@second']).toEqual(snapshots[0]);
  });

  it('replaces the list on a refresh without touching the loading state', () => {
    const loaded = snapshotReducer(snapshotsInitialState, snapshotsLoaded({ snapshots }));
    const refreshed = snapshotReducer(
      { ...loaded, isLoading: true },
      snapshotsRefreshed({ snapshots: [snapshots[1]] }),
    );

    expect(refreshed.ids).toEqual(['tank@first']);
    expect(refreshed.isLoading).toBe(true);
  });

  it('upserts an added snapshot', () => {
    const loaded = snapshotReducer(snapshotsInitialState, snapshotsLoaded({ snapshots }));
    const updated = { ...snapshots[0], dataset: 'tank' };

    const state = snapshotReducer(loaded, snapshotAdded({ snapshot: updated }));

    expect(state.ids).toHaveLength(2);
    expect(state.entities['tank@second']).toEqual(updated);
  });

  it('merges a change into the snapshot it names', () => {
    const loaded = snapshotReducer(snapshotsInitialState, snapshotsLoaded({ snapshots }));

    const state = snapshotReducer(loaded, snapshotChanged({ id: 'tank@first', changes: { holds: { truenas: 1 } } }));

    expect(state.entities['tank@first']).toEqual({ ...snapshots[1], holds: { truenas: 1 } });
  });
});
