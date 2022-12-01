import { createAction, props } from '@ngrx/store';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';

export const haStatusLoaded = createAction(
  '[HA Info API] HA Status Loaded',
  props<{ haStatus: HaStatus }>(),
);

export const failoverLicensedStatusLoaded = createAction(
  '[HA Info API] Failover Licensed Status Loaded',
  props<{ isHaLicensed: boolean }>(),
);

export const loadHaStatus = createAction(
  '[HA Info API] Load HA Status',
);

export const loadFailoverLicensedStatus = createAction(
  '[HA Info API] Load Failover Licensed Status',
);

export const haSettingsUpdated = createAction(
  '[HA Info API] HA Settings Updated',
);
