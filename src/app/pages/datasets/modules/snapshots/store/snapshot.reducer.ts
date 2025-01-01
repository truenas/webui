import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import {
  snapshotPageEntered,
  snapshotAdded,
  snapshotChanged, snapshotRemoved, snapshotsLoaded,
  snapshotsNotLoaded,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';

export interface SnapshotsState extends EntityState<ZfsSnapshot> {
  isLoading: boolean;
  error: string | null;
}

export const adapter = createEntityAdapter<ZfsSnapshot>({
  selectId: (snapshot) => snapshot.name,
  sortComparer: (a, b) => a.snapshot_name.localeCompare(b.snapshot_name),
});

export const snapshotsInitialState: SnapshotsState = adapter.getInitialState({
  isLoading: false,
  error: null,
});

export const snapshotReducer = createReducer(
  snapshotsInitialState,

  on(snapshotPageEntered, (state) => ({ ...state, isLoading: true, error: null })),
  on(snapshotsLoaded, (state, { snapshots }) => adapter.setAll(snapshots, { ...state, isLoading: false })),
  on(snapshotsNotLoaded, (state, { error }) => ({ ...state, error, isLoading: false })),

  on(snapshotAdded, (state, { snapshot }) => adapter.addOne(snapshot, state)),
  on(snapshotChanged, (state, { snapshot }) => adapter.updateOne({
    id: snapshot.name,
    changes: snapshot,
  }, state)),
  on(snapshotRemoved, (state, { id }) => adapter.removeOne(id, state)),
);
