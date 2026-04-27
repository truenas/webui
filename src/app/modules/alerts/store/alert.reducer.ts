import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  alertAdded,
  alertChanged,
  alertDismissedReverted,
  alertPanelClosed,
  alertRemoved,
  alertsLoaded,
  alertsNotLoaded, dismissAlertPressed, dismissAllAlertsPressed, reopenAlertPressed, reopenAllAlertsPressed,
} from 'app/modules/alerts/store/alert.actions';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

export interface AlertsState extends EntityState<Alert> {
  isLoading: boolean;
  isPanelOpen: boolean;
  error: string | null;
}

export const adapter = createEntityAdapter<Alert>({
  sortComparer: (a, b) => Object.values(AlertLevel).indexOf(b.level) - Object.values(AlertLevel).indexOf(a.level)
    || b.datetime.$date - a.datetime.$date
    || (a.klass || '').localeCompare(b.klass || ''),
});

export const alertsInitialState: AlertsState = adapter.getInitialState({
  isLoading: false,
  isPanelOpen: false,
  error: null,
});

export const alertReducer = createReducer(
  alertsInitialState,

  on(alertIndicatorPressed, (state) => ({ ...state, isPanelOpen: !state.isPanelOpen })),
  on(alertPanelClosed, (state) => ({ ...state, isPanelOpen: false })),

  on(adminUiInitialized, (state) => ({ ...state, isLoading: true, error: null as string | null })),
  on(alertsLoaded, (state, { alerts }) => ({
    ...adapter.setAll(alerts, state),
    isLoading: false,
  })),
  on(alertsNotLoaded, (state, { error }) => ({ ...state, error, isLoading: true })),

  on(alertAdded, (state, { alert }) => adapter.addOne(alert, state)),
  on(alertChanged, (state, { alert }) => adapter.updateOne({
    id: alert.id,
    changes: alert,
  }, state)),
  on(alertDismissedReverted, (state, { id, dismissed }) => adapter.updateOne({
    id,
    changes: { dismissed },
  }, state)),
  on(alertRemoved, (state, { id }) => adapter.removeOne(id, state)),

  on(dismissAlertPressed, (state, { ids }) => {
    const updates = ids.map((id) => ({ id, changes: { dismissed: true } }));
    return adapter.updateMany(updates, state);
  }),
  on(reopenAlertPressed, (state, { ids }) => {
    const updates = ids.map((id) => ({ id, changes: { dismissed: false } }));
    return adapter.updateMany(updates, state);
  }),

  on(dismissAllAlertsPressed, (state, { alertIds }) => {
    // If alertIds is undefined, dismiss all (backward compatibility)
    // If alertIds is empty array, dismiss nothing
    // If alertIds has values, dismiss only those
    if (alertIds === undefined) {
      return adapter.map((alert) => ({ ...alert, dismissed: true }), state);
    }
    if (alertIds.length === 0) {
      return state;
    }
    const updates = alertIds.map((id) => ({
      id,
      changes: { dismissed: true },
    }));
    return adapter.updateMany(updates, state);
  }),
  on(reopenAllAlertsPressed, (state, { alertIds }) => {
    // If alertIds is undefined, reopen all (backward compatibility)
    // If alertIds is empty array, reopen nothing
    // If alertIds has values, reopen only those
    if (alertIds === undefined) {
      return adapter.map((alert) => ({ ...alert, dismissed: false }), state);
    }
    if (alertIds.length === 0) {
      return state;
    }
    const updates = alertIds.map((id) => ({
      id,
      changes: { dismissed: false },
    }));
    return adapter.updateMany(updates, state);
  }),
);
