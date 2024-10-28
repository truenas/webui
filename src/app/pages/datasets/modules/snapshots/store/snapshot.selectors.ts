import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, SnapshotsState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';

export const snapshotStateKey = 'snapshots';
export const selectSnapshotState = createFeatureSelector<SnapshotsState>(snapshotStateKey);

const { selectAll, selectTotal } = adapter.getSelectors();

export const selectSnapshots = createSelector(
  selectSnapshotState,
  selectAll,
);

export const selectSnapshotsTotal = createSelector(
  selectSnapshotState,
  selectTotal,
);
