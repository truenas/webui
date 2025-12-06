import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { adapter, alertsInitialState, AlertsState } from 'app/modules/alerts/store/alert.reducer';
import {
  selectAlerts,
  selectAlertState,
  selectDismissedAlerts,
  selectImportantUnreadAlertsCount,
  selectIsAlertPanelOpen,
  selectUnreadAlerts,
} from 'app/modules/alerts/store/alert.selectors';

/* cSpell:ignore klass undismissed */
describe('Alert Selectors', () => {
  const mockAlerts = [
    {
      id: '1',
      level: AlertLevel.Critical,
      dismissed: false,
      datetime: { $date: 3000 },
      klass: 'critical-alert',
    },
    {
      id: '2',
      level: AlertLevel.Warning,
      dismissed: false,
      datetime: { $date: 2000 },
      klass: 'warning-alert',
    },
    {
      id: '3',
      level: AlertLevel.Info,
      dismissed: false,
      datetime: { $date: 1000 },
      klass: 'info-alert',
    },
    {
      id: '4',
      level: AlertLevel.Notice,
      dismissed: true,
      datetime: { $date: 4000 },
      klass: 'notice-alert',
    },
  ] as unknown as Alert[];

  const state: AlertsState = adapter.setAll(mockAlerts, {
    ...alertsInitialState,
    isPanelOpen: true,
  });

  const rootState = {
    alerts: state,
  };

  describe('selectAlertState', () => {
    it('selects the alert state', () => {
      expect(selectAlertState(rootState)).toBe(state);
    });
  });

  describe('selectAlerts', () => {
    it('selects all alerts sorted by level, datetime, and klass', () => {
      const result = selectAlerts(rootState);
      expect(result).toHaveLength(4);
      // Alerts are sorted by level (Critical > Warning > Notice > Info), then datetime desc
      expect(result[0].id).toBe('1'); // Critical
      expect(result[1].id).toBe('2'); // Warning
      expect(result[2].id).toBe('4'); // Notice (dismissed, but sorted)
      expect(result[3].id).toBe('3'); // Info
    });
  });

  describe('selectIsAlertPanelOpen', () => {
    it('selects the isPanelOpen state', () => {
      expect(selectIsAlertPanelOpen(rootState)).toBe(true);
    });

    it('returns false when panel is closed', () => {
      const closedState = {
        alerts: { ...state, isPanelOpen: false },
      };
      expect(selectIsAlertPanelOpen(closedState)).toBe(false);
    });
  });

  describe('selectUnreadAlerts', () => {
    it('filters alerts that are not dismissed', () => {
      const result = selectUnreadAlerts(rootState);
      expect(result).toHaveLength(3);
      expect(result.every((alert) => !alert.dismissed)).toBe(true);
      expect(result.map((alert) => alert.id)).toEqual(['1', '2', '3']);
    });

    it('returns empty array when all alerts are dismissed', () => {
      const allDismissedAlerts = mockAlerts.map((alert) => ({ ...alert, dismissed: true })) as unknown as Alert[];
      const allDismissedState = adapter.setAll(allDismissedAlerts, alertsInitialState);
      const result = selectUnreadAlerts({ alerts: allDismissedState });
      expect(result).toEqual([]);
    });
  });

  describe('selectDismissedAlerts', () => {
    it('filters alerts that are dismissed', () => {
      const result = selectDismissedAlerts(rootState);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
      expect(result[0].dismissed).toBe(true);
    });

    it('returns empty array when no alerts are dismissed', () => {
      const noDismissedAlerts = mockAlerts.map((alert) => ({ ...alert, dismissed: false })) as unknown as Alert[];
      const noDismissedState = adapter.setAll(noDismissedAlerts, alertsInitialState);
      const result = selectDismissedAlerts({ alerts: noDismissedState });
      expect(result).toEqual([]);
    });
  });

  describe('selectImportantUnreadAlertsCount', () => {
    it('counts unread alerts excluding Info level', () => {
      const result = selectImportantUnreadAlertsCount(rootState);
      expect(result).toBe(2); // Critical and Warning, but not Info
    });

    it('excludes dismissed alerts', () => {
      const someAlerts = [
        {
          id: '1', level: AlertLevel.Critical, dismissed: false, datetime: { $date: 1000 },
        } as Alert,
        {
          id: '2', level: AlertLevel.Critical, dismissed: true, datetime: { $date: 2000 },
        } as Alert,
        {
          id: '3', level: AlertLevel.Warning, dismissed: false, datetime: { $date: 3000 },
        } as Alert,
      ];
      const someState = adapter.setAll(someAlerts, alertsInitialState);
      const result = selectImportantUnreadAlertsCount({ alerts: someState });
      expect(result).toBe(2); // Only undismissed critical and warning
    });

    it('excludes Info level alerts', () => {
      const infoAlerts = [
        {
          id: '1', level: AlertLevel.Info, dismissed: false, datetime: { $date: 1000 },
        } as Alert,
        {
          id: '2', level: AlertLevel.Info, dismissed: false, datetime: { $date: 2000 },
        } as Alert,
        {
          id: '3', level: AlertLevel.Warning, dismissed: false, datetime: { $date: 3000 },
        } as Alert,
      ];
      const infoState = adapter.setAll(infoAlerts, alertsInitialState);
      const result = selectImportantUnreadAlertsCount({ alerts: infoState });
      expect(result).toBe(1); // Only warning
    });

    it('returns 0 when no important unread alerts exist', () => {
      const noImportantAlerts = [
        {
          id: '1', level: AlertLevel.Info, dismissed: false, datetime: { $date: 1000 },
        } as Alert,
        {
          id: '2', level: AlertLevel.Critical, dismissed: true, datetime: { $date: 2000 },
        } as Alert,
      ];
      const noImportantState = adapter.setAll(noImportantAlerts, alertsInitialState);
      const result = selectImportantUnreadAlertsCount({ alerts: noImportantState });
      expect(result).toBe(0);
    });
  });

  describe('entity adapter sorting', () => {
    it('sorts alerts by level, then datetime, then klass', () => {
      const unsortedAlerts = [
        {
          id: '1',
          level: AlertLevel.Info,
          datetime: { $date: 1000 },
          klass: 'a-class',
        },
        {
          id: '2',
          level: AlertLevel.Critical,
          datetime: { $date: 2000 },
          klass: 'b-class',
        },
        {
          id: '3',
          level: AlertLevel.Critical,
          datetime: { $date: 3000 },
          klass: 'a-class',
        },
        {
          id: '4',
          level: AlertLevel.Warning,
          datetime: { $date: 2000 },
          klass: 'c-class',
        },
      ] as unknown as Alert[];

      const sortedState = adapter.setAll(unsortedAlerts, alertsInitialState);
      const result = selectAlerts({ alerts: sortedState });

      // Should be sorted by: level (Critical > Warning > Info), then datetime desc, then klass asc
      expect(result[0].id).toBe('3'); // Critical, datetime 3000
      expect(result[1].id).toBe('2'); // Critical, datetime 2000
      expect(result[2].id).toBe('4'); // Warning, datetime 2000
      expect(result[3].id).toBe('1'); // Info, datetime 1000
    });
  });
});
