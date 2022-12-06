import { createReducer, on } from '@ngrx/store';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { systemFeaturesLoaded, systemInfoLoaded, systemInfoDatetimeUpdated } from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  systemFeatures: SystemFeatures;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  systemFeatures: null,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemFeaturesLoaded, (state, { systemFeatures }) => ({ ...state, systemFeatures })),
  on(systemInfoDatetimeUpdated, (state, { datetime }) => ({ ...state, systemInfo: { ...state.systemInfo, datetime } })),
);
