import { createReducer, on } from '@ngrx/store';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { systemFeaturesLoaded, systemInfoLoaded, systemIsHaCapableLoaded } from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  isHaCapable: boolean;
  systemFeatures: SystemFeatures;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  systemFeatures: null,
  isHaCapable: false,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemFeaturesLoaded, (state, { systemFeatures }) => ({ ...state, systemFeatures })),
  on(systemIsHaCapableLoaded, (state, { isHaCapable }) => ({ ...state, isHaCapable })),
);
