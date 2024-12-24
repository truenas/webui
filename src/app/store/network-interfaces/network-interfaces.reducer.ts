import { createReducer, on } from '@ngrx/store';
import { networkInterfacesCheckinLoaded } from 'app/store/network-interfaces/network-interfaces.actions';

export interface NetworkInterfacesState {
  hasPendingChanges: boolean;
  checkinWaiting: number | null;
}

const initialState: NetworkInterfacesState = {
  hasPendingChanges: false,
  checkinWaiting: null,
};

export const networkInterfacesReducer = createReducer(
  initialState,
  on(networkInterfacesCheckinLoaded, (state, { hasPendingChanges, checkinWaiting }) => ({
    ...state,
    hasPendingChanges,
    checkinWaiting,
  })),
);
