import { createAction, props } from '@ngrx/store';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export const snapshotPageEntered = createAction('[Snapshots API] Load');
export const snapshotPageLeft = createAction('[Snapshots API] Page Left');

export const snapshotsLoaded = createAction('[Snapshots API] Loaded', props<{ snapshots: ZfsSnapshot[] }>());
export const snapshotsNotLoaded = createAction('[Snapshots API] Not Loaded', props<{ error: string }>());
export const snapshotsRefreshed = createAction('[Snapshots API] Refreshed', props<{ snapshots: ZfsSnapshot[] }>());

export const snapshotAdded = createAction('[Snapshots API] Snapshot Added', props<{ snapshot: ZfsSnapshot }>());
export const snapshotChanged = createAction(
  '[Snapshots API] Snapshot Changed',
  props<{ id: string; changes: Partial<ZfsSnapshot> }>(),
);
export const snapshotRemoved = createAction('[Snapshots API] Snapshot Removed', props<{ id: string }>());
