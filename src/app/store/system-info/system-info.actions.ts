import { createAction, props } from '@ngrx/store';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export const failoverLicensedStatusLoaded = createAction(
  '[System Info API] Failover Licensed Status Loaded',
  props<{ isHaLicensed: boolean }>(),
);

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

export const haStatusLoaded = createAction(
  '[System Info API] HA Status Loaded',
  props<{ haStatus: HaStatus }>(),
);

export const loadHaStatus = createAction(
  '[System Info API] Load HA Status',
);

export const haSettingsUpdated = createAction(
  '[System Info API] HA Settings Updated',
);

export const ixHardwareLoaded = createAction(
  '[System Info API] System is IxHardware Loaded',
  props<{ isIxHardware: boolean }>(),
);

export const passiveNodeReplaced = createAction(
  '[System Info API] Passive Node Replaced',
);

export const upgradePendingStateLoaded = createAction(
  '[HA Info API] Upgrade pending state loaded',
  props<{ isUpgradePending: boolean }>(),
);

export const systemHaCapabilityLoaded = createAction(
  '[System Info API] System is HA capable Loaded',
  props<{ isSystemHaCapable: boolean }>(),
);
