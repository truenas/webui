import { createReducer, on } from '@ngrx/store';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import {
  failoverLicensedStatusLoaded,
  haStatusLoaded,

} from 'app/store/ha-info/ha-info.actions';

export interface HaInfoState {
  haStatus: HaStatus | null;
  isHaLicensed: boolean;
}

const initialState: HaInfoState = {
  haStatus: null,
  isHaLicensed: false,
};

export const haInfoReducer = createReducer(
  initialState,
  on(haStatusLoaded, (state, { haStatus }) => ({
    ...state,
    haStatus,
  })),
  on(failoverLicensedStatusLoaded, (state, { isHaLicensed }) => ({ ...state, isHaLicensed })),
);
