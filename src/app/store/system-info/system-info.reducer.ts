import { createReducer, on } from '@ngrx/store';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { systemInfoLoaded } from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
}

const initialState: SystemInfoState = {
  systemInfo: null,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
);
