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
  error: string;
}

export const adapter = createEntityAdapter<Alert>({
  sortComparer: (a, b) => Object.values(AlertLevel).indexOf(b.level) - Object.values(AlertLevel).indexOf(a.level)
    || (a.klass || '').localeCompare(b.klass || '')
    || a.datetime.$date - b.datetime.$date,
});

export const alertsInitialState = adapter.getInitialState({
  isLoading: false,
  isPanelOpen: false,
  error: null,
});

export const alertReducer = createReducer(
  alertsInitialState,

  on(alertIndicatorPressed, (state) => ({ ...state, isPanelOpen: !state.isPanelOpen })),
  on(alertPanelClosed, (state) => ({ ...state, isPanelOpen: false })),

  on(adminUiInitialized, (state) => ({ ...state, isLoading: true, error: null })),
  on(alertsLoaded, (state, { alerts }) => {
    return {
      ...adapter.setAll(alerts, state),
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

  on(dismissAlertPressed, (state, { id }) => adapter.updateOne({
    id,
    changes: {
      dismissed: true,
    },
  }, state)),
  on(reopenAlertPressed, (state, { id }) => adapter.updateOne({
    id,
    changes: {
      dismissed: false,
    },
  }, state)),

  on(dismissAllAlertsPressed, (state) => {
    return adapter.map((alert) => ({ ...alert, dismissed: true }), state);
  }),
  on(reopenAllAlertsPressed, (state) => {
    return adapter.map((alert) => ({ ...alert, dismissed: false }), state);
  }),
);
