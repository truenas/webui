import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NetworkInterfacesState } from 'app/store/network-interfaces/network-interfaces.reducer';

export const networkInterfacesKey = 'networkInterfaces';

export const selectNetworkInterfacesState = createFeatureSelector<NetworkInterfacesState>(networkInterfacesKey);

export const selectHasPendingNetworkChanges = createSelector(
  selectNetworkInterfacesState,
  (state) => state.hasPendingChanges,
);

export const selectNetworkInterfacesCheckinWaiting = createSelector(
  selectNetworkInterfacesState,
  (state) => state.checkinWaiting,
);
