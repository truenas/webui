import { createAction, props } from '@ngrx/store';

export const adminUiInitialized = createAction('[Admin UI] Initialized');

export const adminNetworkInterfacesChanged = createAction(
  '[Admin UI] Network Interfaces Changed',
  props<{ commit: boolean; checkIn?: boolean }>(),
);
