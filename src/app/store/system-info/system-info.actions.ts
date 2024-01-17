import { createAction, props } from '@ngrx/store';
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

export const systemHostIdLoaded = createAction(
  '[System Info API] System Host ID Loaded',
  props<{ systemHostId: string }>(),
);

export const systemIsStableLoaded = createAction(
  '[System Info API] System is stable Loaded',
  props<{ systemIsStable: boolean }>(),
);

export const ixHardwareLoaded = createAction(
  '[System Info API] System is IxHardware Loaded',
  props<{ isIxHardware: boolean }>(),
);

export const passiveNodeReplaced = createAction(
  '[System Info API] Passive Node Replaced',
);

export const systemInfoUpdated = createAction(
  '[System Info API] System Info Updated',
);
