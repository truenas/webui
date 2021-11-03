import { createFeatureSelector, createSelector } from '@ngrx/store';
import { snapshotAdapter, SnapshotState } from 'app/store/states/storage-snapshot.state';

export const {
  selectIds: _selectSnapshotDataIds,
  selectEntities: _selectSnapshotEntities,
  selectAll: _selectAllSnapshot,
  selectTotal: _selectSnapshotTotal,
} = snapshotAdapter.getSelectors();

export const selectSnapshotState = createFeatureSelector<SnapshotState>('snapshot');

export const selectSnapshotIds = createSelector(
  selectSnapshotState,
  _selectSnapshotDataIds,
);

export const selectSnapshotEntities = createSelector(
  selectSnapshotState,
  _selectSnapshotEntities,
);

export const selectAllSnapshot = createSelector(
  selectSnapshotState,
  _selectAllSnapshot,
);

export const selectSnapshotError = createSelector(
  selectSnapshotState,
  (state: SnapshotState): boolean => state.error,
);

export const selectSnapshotLoading = createSelector(
  selectSnapshotState,
  (state: SnapshotState): boolean => state.loading,
);

export const selectSnapshotTotal = createSelector(
  selectSnapshotState,
  (state: SnapshotState): number => state.total,
);
