import { createAction, props } from '@ngrx/store';
import { AppBarItem } from 'app/interfaces/app-bar.interface';

export const appBarOpened = createAction(
  '[AppBar] Opened',
  props<{ item: AppBarItem }>(),
);

export const appBarClosed = createAction(
  '[AppBar] Closed',
  props<{ stateName: string }>(),
);

export const appBarMinimized = createAction(
  '[AppBar] Minimized',
  props<{ stateName: string }>(),
);

export const appBarAdded = createAction(
  '[AppBar] Added',
  props<{ item: AppBarItem }>(),
);
