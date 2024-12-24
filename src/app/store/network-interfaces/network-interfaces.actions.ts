import { createAction, props } from '@ngrx/store';

export const networkInterfacesChanged = createAction(
  '[Network Interfaces] Changed',
  props<{ commit: boolean; checkIn?: boolean }>(),
);

export const networkInterfacesCheckinLoaded = createAction(
  '[Network Interfaces] Checkin Loaded',
  props<{ hasPendingChanges: boolean; checkinWaiting: number | null }>(),
);

export const checkinIndicatorPressed = createAction(
  '[Network Interfaces] Checkin Indicator Pressed',
);
