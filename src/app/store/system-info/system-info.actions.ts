import { createAction, props } from '@ngrx/store';
import { EntitlementFacts } from 'app/interfaces/entitlement.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export const systemInfoLoaded = createAction(
  '[System Info API] Info Loaded',
  props<{ systemInfo: SystemInfo }>(),
);

export const entitlementFactsLoaded = createAction(
  '[System Info API] Entitlement Facts Loaded',
  props<{ entitlementFacts: EntitlementFacts }>(),
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
