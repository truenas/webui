import { createReducer, on } from '@ngrx/store';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';

export interface RebootInfoState {
  thisNodeRebootInfo: SystemRebootInfo | null;
  otherNodeRebootInfo: SystemRebootInfo | null;
}

const initialState: RebootInfoState = {
  thisNodeRebootInfo: null,
  otherNodeRebootInfo: null,
};

export const rebootInfoReducer = createReducer(
  initialState,
  on(rebootInfoLoaded, (state, { thisNodeRebootInfo, otherNodeRebootInfo }) => ({
    ...state,
    thisNodeRebootInfo,
    otherNodeRebootInfo,
  })),
);
