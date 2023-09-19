import { createAction, props } from '@ngrx/store';
import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';

export const alertIndicatorPressed = createAction('[Topbar] Alert Indicator Pressed');
export const jobIndicatorPressed = createAction('[Topbar] Job Indicator Pressed');

export const sidenavUpdated = createAction('[Topbar] Sidenav Updated', props<SidenavStatusData>());
export const sidenavIndicatorPressed = createAction('[Topbar] Sidenav Indicator Pressed');
