import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { adapter, AlertsState } from 'app/modules/alerts/store/alert.reducer';

export const alertStateKey = 'alerts';
export const selectAlertState = createFeatureSelector<AlertsState>(alertStateKey);

export interface AlertSlice {
  [alertStateKey]: AlertsState;
}

const { selectAll } = adapter.getSelectors();

export const selectAlerts = createSelector(
  selectAlertState,
  selectAll,
);

export const selectIsAlertPanelOpen = createSelector(
  selectAlertState,
  (state) => state.isPanelOpen,
);

export const selectUnreadAlerts = createSelector(
  selectAlerts,
  (alerts) => alerts.filter((alert) => !alert.dismissed),
);

export const selectDismissedAlerts = createSelector(
  selectAlerts,
  (alerts) => alerts.filter((alert) => alert.dismissed),
);

export const selectImportantUnreadAlertsCount = createSelector(
  selectUnreadAlerts,
  (alerts) => {
    return alerts.filter((alert) => !alert.dismissed && alert.level !== AlertLevel.Info).length;
  },
);
