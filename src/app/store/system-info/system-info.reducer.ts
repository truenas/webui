import { createReducer, on } from '@ngrx/store';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { haStatusLoaded, systemFeaturesLoaded, systemInfoLoaded } from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  haStatus: HaStatus;
  systemFeatures: SystemFeatures;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  haStatus: null,
  systemFeatures: null,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemFeaturesLoaded, (state, { systemFeatures }) => ({ ...state, systemFeatures })),
  on(haStatusLoaded, (state, { haStatus }) => ({ ...state, haStatus })),
);
