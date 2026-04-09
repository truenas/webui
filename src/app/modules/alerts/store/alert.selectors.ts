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

/**
 * Selector to get unread alerts that require user attention.
 * Used for badge counts, severity computation, and nav-badge integration.
 * Only includes WARNING level and above (excludes Info and Notice).
 */
export const selectActionableAlerts = createSelector(
  selectUnreadAlerts,
  (alerts) => alerts.filter((alert) => ![AlertLevel.Info, AlertLevel.Notice].includes(alert.level)),
);

export const selectImportantUnreadAlertsCount = createSelector(
  selectActionableAlerts,
  (alerts) => alerts.length,
);

export const criticalLevels: AlertLevel[] = [
  AlertLevel.Critical, AlertLevel.Alert, AlertLevel.Emergency, AlertLevel.Error,
];

export type AlertSeverity = 'critical' | 'warning' | null;

export const selectTopAlertSeverity = createSelector(
  selectActionableAlerts,
  (alerts): AlertSeverity => {
    if (alerts.length === 0) return null;
    if (alerts.some((alert) => criticalLevels.includes(alert.level))) return 'critical';
    return 'warning';
  },
);
