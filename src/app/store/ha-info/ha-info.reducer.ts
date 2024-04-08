import { createReducer, on } from '@ngrx/store';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import {
  failoverLicensedStatusLoaded,
  haStatusLoaded,

} from 'app/store/ha-info/ha-info.actions';
import { failoverUpgradeFinished, upgradePendingStateLoaded } from 'app/store/ha-upgrade/ha-upgrade.actions';

export interface HaInfoState {
  haStatus: HaStatus;
  isHaLicensed: boolean;
  isUpgradePending: boolean;
}

const initialState: HaInfoState = {
  haStatus: null,
  isHaLicensed: false,
  isUpgradePending: false,
};

export const haInfoReducer = createReducer(
  initialState,
  on(haStatusLoaded, (state, { haStatus }) => ({
    ...state,
    haStatus,
  })),
  on(failoverLicensedStatusLoaded, (state, { isHaLicensed }) => ({ ...state, isHaLicensed })),
  on(upgradePendingStateLoaded, (state, { isUpgradePending }) => ({ ...state, isUpgradePending })),
  on(failoverUpgradeFinished, (state) => ({ ...state, isUpgradePending: false })),
);
