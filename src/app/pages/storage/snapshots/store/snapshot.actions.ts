import { createAction, props } from '@ngrx/store';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export const loadSnapshots = createAction('[Snapshots API] Load', props<{ extra: boolean }>());
export const snapshotsLoaded = createAction('[Snapshots API] Loaded', props<{ snapshots: ZfsSnapshot[] }>());
export const snapshotsNotLoaded = createAction('[Snapshots API] Not Loaded', props<{ error: string }>());

export const snapshotAdded = createAction('[Snapshots API] Snapshot Added', props<{ snapshot: ZfsSnapshot }>());
export const snapshotChanged = createAction('[Snapshots API] Snapshot Changed', props<{ snapshot: ZfsSnapshot }>());
export const snapshotRemoved = createAction('[Snapshots API] Snapshot Removed', props<{ id: string }>());

export const showExtraColumnsPressed = createAction('[Snapshot Toolbar] Show Extra Columns');
