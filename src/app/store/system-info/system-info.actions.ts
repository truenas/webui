import { createAction, props } from '@ngrx/store';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export const systemInfoLoaded = createAction(
  '[System Info API] Info Loaded',
  props<{ systemInfo: SystemInfo }>(),
);

export const systemFeaturesLoaded = createAction(
  '[System Info API] Features Loaded',
  props<{ systemFeatures: SystemFeatures }>(),
);

export const systemInfoDatetimeUpdated = createAction(
  '[System Info API] Info Datetime Updated',
  props<{ datetime: ApiTimestamp }>(),
);

export const passiveNodeReplaced = createAction(
  '[System Info API] Passive Node Replaced',
);
