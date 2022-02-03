import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';

export enum SnapshotListActions {
  Clone = 'clone',
  Rollback = 'rollback',
  Delete = 'delete',
}

export interface SnapshotListEvent {
  action: SnapshotListActions;
  row: SnapshotListRow;
}
