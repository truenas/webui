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
  (alerts) => alerts.filter((alert) => ![AlertLevel.Info, AlertLevel.Notice].includes(alert.level)).length,
);

/**
 * Selector to get unread alerts for badge calculation
 * Components can enhance these alerts with SmartAlertService and compute badge counts
 */
export const selectAlertsForNavBadges = createSelector(
  selectUnreadAlerts,
  (alerts) => alerts,
);
