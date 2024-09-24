import { createReducer, on } from '@ngrx/store';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';

export interface RebootInfoState {
  thisNodeInfo: SystemRebootInfo | null;
  otherNodeInfo: SystemRebootInfo | null;
}

const initialState: RebootInfoState = {
  thisNodeInfo: null,
  otherNodeInfo: null,
};

export const rebootInfoReducer = createReducer(
  initialState,
  on(rebootInfoLoaded, (state, { thisNodeInfo, otherNodeInfo }) => ({
    ...state,
    thisNodeInfo,
    otherNodeInfo,
  })),
);
