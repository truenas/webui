import { createReducer, on } from '@ngrx/store';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  haStatusLoaded,
  systemFeaturesLoaded,
  systemInfoLoaded,
  systemInfoDatetimeUpdated,
  upgradePendingStateLoaded,
  failoverLicensedStatusLoaded,
  systemHaCapabilityLoaded,
  ixHardwareLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  haStatus: HaStatus;
  systemFeatures: SystemFeatures;
  isUpgradePending: boolean;
  hasOnlyMissmatchVersionsReason: boolean;
  isHaLicensed: boolean;
  isSystemHaCapable: boolean;
  isIxHardware: boolean;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  haStatus: null,
  systemFeatures: null,
  isUpgradePending: false,
  hasOnlyMissmatchVersionsReason: false,
  isHaLicensed: false,
  isSystemHaCapable: false,
  isIxHardware: false,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemFeaturesLoaded, (state, { systemFeatures }) => ({ ...state, systemFeatures })),
  on(systemInfoDatetimeUpdated, (state, { datetime }) => ({ ...state, systemInfo: { ...state.systemInfo, datetime } })),
  on(failoverLicensedStatusLoaded, (state, { isHaLicensed }) => ({ ...state, isHaLicensed })),
  on(haStatusLoaded, (state, { haStatus }) => ({
    ...state,
    haStatus,
    hasOnlyMissmatchVersionsReason:
      haStatus.reasons.length === 1 && haStatus.reasons[0] === FailoverDisabledReason.MismatchVersions,
  })),
  on(upgradePendingStateLoaded, (state, { isUpgradePending }) => ({ ...state, isUpgradePending })),
  on(systemHaCapabilityLoaded, (state, { isSystemHaCapable }) => ({ ...state, isSystemHaCapable })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
