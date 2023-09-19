import { createAction, props } from '@ngrx/store';

export const upgradePendingStateLoaded = createAction(
  '[HA Upgrade] Upgrade pending state loaded',
  props<{ isUpgradePending: boolean }>(),
);

export const updatePendingIndicatorPressed = createAction('[HA Upgrade] Indicator Pressed');

export const failoverUpgradeFinished = createAction('[HA Upgrade] Upgrade Finished');
