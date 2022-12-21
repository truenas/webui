import { createReducer, on } from '@ngrx/store';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import {
  failoverLicensedStatusLoaded,
  haStatusLoaded,
  upgradePendingStateLoaded,
} from 'app/store/ha-info/ha-info.actions';

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
    isUpgradePending: haStatus?.reasons.includes(FailoverDisabledReason.MismatchVersions),
  })),
  on(failoverLicensedStatusLoaded, (state, { isHaLicensed }) => ({ ...state, isHaLicensed })),
  on(upgradePendingStateLoaded, (state, { isUpgradePending }) => ({ ...state, isUpgradePending })),
);
