import { createAction, props } from '@ngrx/store';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export const snapshotPageEntered = createAction('[Snapshots API Old] Load');

export const snapshotsLoaded = createAction('[Snapshots API Old] Loaded', props<{ snapshots: ZfsSnapshot[] }>());
export const snapshotsNotLoaded = createAction('[Snapshots API Old] Not Loaded', props<{ error: string }>());

export const snapshotAdded = createAction('[Snapshots API Old] Snapshot Added', props<{ snapshot: ZfsSnapshot }>());
export const snapshotChanged = createAction('[Snapshots API Old] Snapshot Changed', props<{ snapshot: ZfsSnapshot }>());
export const snapshotRemoved = createAction('[Snapshots API Old] Snapshot Removed', props<{ id: string }>());
