import { createAction, props } from '@ngrx/store';

export const networkInterfacesChanged = createAction(
  '[Network Interfaces] Changed',
  props<{ commit: boolean; checkIn?: boolean }>(),
);
