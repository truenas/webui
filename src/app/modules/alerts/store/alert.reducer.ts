import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Alert } from 'app/interfaces/alert.interface';
import {
  alertAdded,
  alertChanged, alertPanelClosed,
  alertRemoved,
  alertsLoaded,
  alertsNotLoaded, dismissAlertPressed, dismissAllAlertsPressed, reopenAlertPressed, reopenAllAlertsPressed,
} from 'app/modules/alerts/store/alert.actions';
import { adminUiInitialized } from 'app/store/actions/admin.actions';
import { alertIndicatorPressed } from 'app/store/actions/topbar.actions';

export interface AlertsState extends EntityState<Alert> {
  isLoading: boolean;
  isPanelOpen: boolean;
  error: string;
}

export const adapter = createEntityAdapter<Alert>({
  sortComparer: (a, b) => b.datetime.$date - a.datetime.$date,
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
