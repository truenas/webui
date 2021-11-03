import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { SnapshotListRow } from 'app/pages/storage/snapshots/snapshot-list/snapshot-list-row.interface';

export interface SnapshotState extends EntityState<SnapshotListRow> {
  error: boolean;
  loading: boolean;
  total: number;
}

export const snapshotAdapter: EntityAdapter<SnapshotListRow> = createEntityAdapter<SnapshotListRow>({
  selectId: (snapshot: SnapshotListRow) => snapshot.id,
});

export const initialSnapshotState: SnapshotState = snapshotAdapter.getInitialState({
  error: false,
  loading: true,
  total: 0,
});
