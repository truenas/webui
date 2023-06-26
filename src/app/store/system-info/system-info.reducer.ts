import { createReducer, on } from '@ngrx/store';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  ixHardwareLoaded, systemFeaturesLoaded, systemHaCapabilityLoaded, systemInfoLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  systemFeatures: SystemFeatures;
  isSystemHaCapable: boolean;
  isIxHardware: boolean;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  systemFeatures: null,
  isSystemHaCapable: false,
  isIxHardware: false,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemFeaturesLoaded, (state, { systemFeatures }) => ({ ...state, systemFeatures })),
  on(systemHaCapabilityLoaded, (state, { isSystemHaCapable }) => ({ ...state, isSystemHaCapable })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
