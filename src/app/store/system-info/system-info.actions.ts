import { createAction, props } from '@ngrx/store';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
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

export const haStatusLoaded = createAction(
  '[System Info API] HA Status Loaded',
  props<{ haStatus: HaStatus }>(),
);

export const loadHaStatus = createAction(
  '[System Info API] Load HA Status',
);
