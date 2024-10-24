import { createAction, props } from '@ngrx/store';
import { Alert } from 'app/interfaces/alert.interface';

export const alertPanelClosed = createAction('[Alert] Panel Closed');

export const alertsLoaded = createAction('[Alerts API] Loaded', props<{ alerts: Alert[] }>());
export const alertsNotLoaded = createAction('[Alerts API] Not Loaded', props<{ error: string }>());

export const alertAdded = createAction('[Alerts API] Alert Added', props<{ alert: Alert }>());
export const alertChanged = createAction('[Alerts API] Alert Changed', props<{ alert: Alert }>());
export const alertsDismissedChanged = createAction('[Alerts API] Alerts Dismissed Status Changed', props<{ dismissed: boolean }>());
export const alertReceivedWhenPanelIsOpen = createAction('[Alerts API] Alert Received (when alerts panel is open)');
export const alertRemoved = createAction('[Alerts API] Alert Removed', props<{ id: string }>());

export const dismissAlertPressed = createAction('[Alert Panel] Dismiss Pressed', props<{ id: string }>());
export const reopenAlertPressed = createAction('[Alert Panel] Reopen Pressed', props<{ id: string }>());

export const dismissAllAlertsPressed = createAction('[Alert Panel] Dismiss All Pressed');
export const reopenAllAlertsPressed = createAction('[Alert Panel] Reopen All Pressed');
