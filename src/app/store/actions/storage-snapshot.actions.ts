/* eslint-disable max-classes-per-file */
import { Action } from '@ngrx/store';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { SnapshotListRow } from 'app/pages/storage/snapshots/snapshot-list/snapshot-list-row.interface';

export enum SnapshotActionType {
  Loading = '[Storage Snapshots] Loading',
  LoadSuccess = '[Storage Snapshots] LoadSuccess',
  LoadFailure = '[Storage Snapshots] LoadFailure',
}

export class SnapshotLoadAction implements Action {
  readonly type = SnapshotActionType.Loading;
  constructor(public payload: QueryParams<ZfsSnapshot>) {}
}

export class SnapshotLoadSuccessAction implements Action {
  readonly type = SnapshotActionType.LoadSuccess;
  constructor(public payload: SnapshotListRow[]) {}
}

export class SnapshotLoadFailAction implements Action {
  readonly type = SnapshotActionType.LoadFailure;
  constructor(public error: boolean) {}
}

export type SnapshotAction = SnapshotLoadAction | SnapshotLoadSuccessAction | SnapshotLoadFailAction;
