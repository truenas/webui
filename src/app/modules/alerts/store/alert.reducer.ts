import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  alertAdded,
  alertChanged,
  alertPanelClosed,
  alertRemoved,
  alertsDismissedChanged,
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
  on(alertsLoaded, (state, { alerts }) => {
    // Preserve dismissed state for alerts that were dismissed locally
    // but haven't synced to the server yet
    const locallyDismissedIds = new Set(
      Object.values(state.entities)
        .filter((a): a is Alert => !!a?.dismissed)
        .map((a) => a.id),
    );

    const mergedAlerts = alerts.map((alert) => {
      // If this alert was dismissed locally, keep it dismissed
      if (locallyDismissedIds.has(alert.id)) {
        return { ...alert, dismissed: true };
      }
      return alert;
    });

    return {
      ...adapter.setAll(mergedAlerts, state),
      isLoading: false,
    };
  }),
  on(alertsNotLoaded, (state, { error }) => ({ ...state, error, isLoading: true })),

  on(alertAdded, (state, { alert }) => adapter.addOne(alert, state)),
  on(alertChanged, (state, { alert }) => adapter.updateOne({
    id: alert.id,
    changes: alert,
  }, state)),
  on(alertsDismissedChanged, (state, { dismissed }) => {
    return adapter.map((alert) => ({ ...alert, dismissed }), state);
  }),
  on(alertRemoved, (state, { id }) => adapter.removeOne(id, state)),

  on(dismissAlertPressed, (state, { id }) => {
    // Find the alert being dismissed
    const alert = state.entities[id];
    if (!alert) {
      return state;
    }

    // Find all alerts with the same key and mark them as dismissed
    const updates = Object.values(state.entities)
      .filter((a): a is Alert => a !== undefined && a.key === alert.key)
      .map((a) => ({
        id: a.id,
        changes: { dismissed: true },
      }));

    return adapter.updateMany(updates, state);
  }),
  on(reopenAlertPressed, (state, { id }) => {
    // Find the alert being reopened
    const alert = state.entities[id];
    if (!alert) {
      return state;
    }

    // Find all alerts with the same key and mark them as not dismissed
    const updates = Object.values(state.entities)
      .filter((a): a is Alert => a !== undefined && a.key === alert.key)
      .map((a) => ({
        id: a.id,
        changes: { dismissed: false },
      }));

    return adapter.updateMany(updates, state);
  }),

  on(dismissAllAlertsPressed, (state, { alertIds }) => {
    // If specific alert IDs provided, only dismiss those; otherwise dismiss all
    if (alertIds && alertIds.length > 0) {
      const updates = alertIds.map((id) => ({
        id,
        changes: { dismissed: true },
      }));
      return adapter.updateMany(updates, state);
    }
    return adapter.map((alert) => ({ ...alert, dismissed: true }), state);
  }),
  on(reopenAllAlertsPressed, (state, { alertIds }) => {
    // If specific alert IDs provided, only reopen those; otherwise reopen all
    if (alertIds && alertIds.length > 0) {
      const updates = alertIds.map((id) => ({
        id,
        changes: { dismissed: false },
      }));
      return adapter.updateMany(updates, state);
    }
    return adapter.map((alert) => ({ ...alert, dismissed: false }), state);
  }),
);
