import { createAction, props } from '@ngrx/store';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';

export const haStatusLoaded = createAction(
  '[HA Info API] HA Status Loaded',
  props<{ haStatus: HaStatus }>(),
);

export const loadUpgradePendingState = createAction('[HA Info API] Load Upgrade pending state');

export const upgradePendingStateLoaded = createAction(
  '[HA Info API] Upgrade pending state loaded',
  props<{ isUpgradePending: boolean }>(),
);

export const failoverLicensedStatusLoaded = createAction(
  '[HA Info API] Failover Licensed Status Loaded',
  props<{ isHaLicensed: boolean }>(),
);

export const haSettingsUpdated = createAction(
  '[HA Info API] HA Settings Updated',
);
