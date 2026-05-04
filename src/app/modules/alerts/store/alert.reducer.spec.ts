import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  alertAdded,
  alertChanged,
  alertDismissedReverted,
  alertPanelClosed,
  alertRemoved,
  alertsLoaded,
  alertsNotLoaded,
  dismissAlertPressed,
  dismissAllAlertsPressed,
  reopenAlertPressed,
  reopenAllAlertsPressed,
} from 'app/modules/alerts/store/alert.actions';
import { adapter, alertReducer, alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

describe('alertReducer', () => {
  const mockAlerts = [
    {
      id: '1',
      key: 'alert-key-1',
      level: AlertLevel.Critical,
      dismissed: false,
      datetime: { $date: 2000 },
      klass: 'alert1',
    },
    {
      id: '2',
      key: 'alert-key-2',
      level: AlertLevel.Warning,
      dismissed: false,
      datetime: { $date: 1000 },
      klass: 'alert2',
    },
  ] as unknown as Alert[];

  const mockAlert = mockAlerts[0];
  const mockAlert2 = mockAlerts[1];

  describe('initial state', () => {
    it('has correct default values', () => {
      expect(alertsInitialState).toEqual({
        ids: [],
        entities: {},
        isLoading: false,
        isPanelOpen: false,
        error: null,
      });
    });
  });

  describe('alertIndicatorPressed', () => {
    it('toggles isPanelOpen from false to true', () => {
      const state = alertReducer(alertsInitialState, alertIndicatorPressed());
      expect(state.isPanelOpen).toBe(true);
    });

    it('toggles isPanelOpen from true to false', () => {
      const initialState = { ...alertsInitialState, isPanelOpen: true };
      const state = alertReducer(initialState, alertIndicatorPressed());
      expect(state.isPanelOpen).toBe(false);
    });
  });

  describe('alertPanelClosed', () => {
    it('sets isPanelOpen to false', () => {
      const initialState = { ...alertsInitialState, isPanelOpen: true };
      const state = alertReducer(initialState, alertPanelClosed());
      expect(state.isPanelOpen).toBe(false);
    });
  });

  describe('adminUiInitialized', () => {
    it('sets isLoading to true and clears error', () => {
      const initialState = { ...alertsInitialState, error: 'Previous error' };
      const state = alertReducer(initialState, adminUiInitialized());
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('alertsLoaded', () => {
    it('sets alerts and sets isLoading to false', () => {
      const initialState = { ...alertsInitialState, isLoading: true };
      const state = alertReducer(initialState, alertsLoaded({ alerts: mockAlerts }));

      expect(state.isLoading).toBe(false);
      expect(state.ids).toHaveLength(2);
      expect(state.entities['1']).toEqual(mockAlert);
      expect(state.entities['2']).toEqual(mockAlert2);
    });

    it('replaces existing alerts', () => {
      const existingAlerts = [{
        id: '3',
        level: AlertLevel.Info,
        dismissed: false,
        datetime: { $date: 500 },
        klass: 'old-alert',
      }] as unknown as Alert[];

      const initialState = adapter.setAll(existingAlerts, alertsInitialState);
      const state = alertReducer(initialState, alertsLoaded({ alerts: [mockAlert] }));

      expect(state.ids).toContain('1');
      expect(state.ids).not.toContain('3');
      expect(state.entities['1']).toEqual(mockAlert);
      expect(state.entities['3']).toBeUndefined();
    });

    it('reflects server dismissed state without local merging', () => {
      const localAlerts = [
        { ...mockAlert, dismissed: true },
        { ...mockAlert2, dismissed: false },
      ] as unknown as Alert[];
      const initialState = adapter.setAll(localAlerts, alertsInitialState);

      const serverAlerts = [
        { ...mockAlert, dismissed: false },
        { ...mockAlert2, dismissed: false },
      ] as unknown as Alert[];
      const state = alertReducer(initialState, alertsLoaded({ alerts: serverAlerts }));

      expect(state.entities['1']?.dismissed).toBe(false);
      expect(state.entities['2']?.dismissed).toBe(false);
    });
  });

  describe('alertsNotLoaded', () => {
    it('sets error and keeps isLoading true', () => {
      const state = alertReducer(alertsInitialState, alertsNotLoaded({ error: 'Failed to load' }));
      expect(state.error).toBe('Failed to load');
      expect(state.isLoading).toBe(true);
    });
  });

  describe('alertAdded', () => {
    it('adds a new alert to the state', () => {
      const state = alertReducer(alertsInitialState, alertAdded({ alert: mockAlert }));
      expect(state.ids).toContain('1');
      expect(state.entities['1']).toEqual(mockAlert);
    });

    it('adds alert maintaining sort order', () => {
      const initialState = adapter.addOne(mockAlert2, alertsInitialState);
      const state = alertReducer(initialState, alertAdded({ alert: mockAlert }));

      // Critical should come before Warning
      expect(state.ids[0]).toBe('1');
      expect(state.ids[1]).toBe('2');
    });
  });

  describe('alertChanged', () => {
    it('updates an existing alert', () => {
      const initialState = adapter.addOne(mockAlert, alertsInitialState);
      const updatedAlert = {
        ...mockAlert,
        dismissed: true,
      } as Alert;

      const state = alertReducer(initialState, alertChanged({ alert: updatedAlert }));
      expect(state.entities['1']?.dismissed).toBe(true);
    });
  });

  describe('alertDismissedReverted', () => {
    it('reverts a single id to the supplied dismissed value', () => {
      const initialState = adapter.setAll(mockAlerts, alertsInitialState);
      const state = alertReducer(initialState, alertDismissedReverted({ id: '1', dismissed: true }));

      expect(state.entities['1']?.dismissed).toBe(true);
      expect(state.entities['2']?.dismissed).toBe(false);
    });
  });

  describe('alertRemoved', () => {
    it('removes alert from state', () => {
      const initialState = adapter.addOne(mockAlert, alertsInitialState);
      const state = alertReducer(initialState, alertRemoved({ id: '1' }));

      expect(state.ids).not.toContain('1');
      expect(state.entities['1']).toBeUndefined();
    });
  });

  describe('dismissAlertPressed', () => {
    it('marks every id in the payload as dismissed', () => {
      const initialState = adapter.setAll(mockAlerts, alertsInitialState);
      const state = alertReducer(initialState, dismissAlertPressed({ ids: ['1'] }));

      expect(state.entities['1']?.dismissed).toBe(true);
      expect(state.entities['2']?.dismissed).toBe(false);
    });

    it('marks every id in a multi-id payload as dismissed', () => {
      const initialState = adapter.setAll(mockAlerts, alertsInitialState);
      const state = alertReducer(initialState, dismissAlertPressed({ ids: ['1', '2'] }));

      expect(state.entities['1']?.dismissed).toBe(true);
      expect(state.entities['2']?.dismissed).toBe(true);
    });
  });

  describe('reopenAlertPressed', () => {
    it('marks every id in the payload as not dismissed', () => {
      const dismissedAlerts = mockAlerts.map((a) => ({ ...a, dismissed: true })) as unknown as Alert[];
      const initialState = adapter.setAll(dismissedAlerts, alertsInitialState);
      const state = alertReducer(initialState, reopenAlertPressed({ ids: ['1'] }));

      expect(state.entities['1']?.dismissed).toBe(false);
      expect(state.entities['2']?.dismissed).toBe(true);
    });

    it('marks every id in a multi-id payload as not dismissed', () => {
      const dismissedAlerts = mockAlerts.map((a) => ({ ...a, dismissed: true })) as unknown as Alert[];
      const initialState = adapter.setAll(dismissedAlerts, alertsInitialState);
      const state = alertReducer(initialState, reopenAlertPressed({ ids: ['1', '2'] }));

      expect(state.entities['1']?.dismissed).toBe(false);
      expect(state.entities['2']?.dismissed).toBe(false);
    });
  });

  describe('dismissAllAlertsPressed', () => {
    it('marks all alerts as dismissed when no alertIds provided', () => {
      const initialState = adapter.setAll(mockAlerts, alertsInitialState);
      const state = alertReducer(initialState, dismissAllAlertsPressed({ alertIds: undefined }));

      expect(state.entities['1']?.dismissed).toBe(true);
      expect(state.entities['2']?.dismissed).toBe(true);
    });

    it('marks only specified alerts as dismissed when alertIds provided', () => {
      const initialState = adapter.setAll(mockAlerts, alertsInitialState);
      const state = alertReducer(initialState, dismissAllAlertsPressed({ alertIds: ['1'] }));

      expect(state.entities['1']?.dismissed).toBe(true);
      expect(state.entities['2']?.dismissed).toBe(false);
    });

    it('handles empty alertIds array by dismissing no alerts', () => {
      const initialState = adapter.setAll(mockAlerts, alertsInitialState);
      const state = alertReducer(initialState, dismissAllAlertsPressed({ alertIds: [] }));

      expect(state.entities['1']?.dismissed).toBe(false);
      expect(state.entities['2']?.dismissed).toBe(false);
    });
  });

  describe('reopenAllAlertsPressed', () => {
    it('marks all alerts as not dismissed when no alertIds provided', () => {
      const dismissedAlerts = mockAlerts.map((a) => ({ ...a, dismissed: true })) as unknown as Alert[];
      const initialState = adapter.setAll(dismissedAlerts, alertsInitialState);
      const state = alertReducer(initialState, reopenAllAlertsPressed({ alertIds: undefined }));

      expect(state.entities['1']?.dismissed).toBe(false);
      expect(state.entities['2']?.dismissed).toBe(false);
    });

    it('marks only specified alerts as not dismissed when alertIds provided', () => {
      const dismissedAlerts = mockAlerts.map((a) => ({ ...a, dismissed: true })) as unknown as Alert[];
      const initialState = adapter.setAll(dismissedAlerts, alertsInitialState);
      const state = alertReducer(initialState, reopenAllAlertsPressed({ alertIds: ['1'] }));

      expect(state.entities['1']?.dismissed).toBe(false);
      expect(state.entities['2']?.dismissed).toBe(true);
    });

    it('handles empty alertIds array by reopening no alerts', () => {
      const dismissedAlerts = mockAlerts.map((a) => ({ ...a, dismissed: true })) as unknown as Alert[];
      const initialState = adapter.setAll(dismissedAlerts, alertsInitialState);
      const state = alertReducer(initialState, reopenAllAlertsPressed({ alertIds: [] }));

      expect(state.entities['1']?.dismissed).toBe(true);
      expect(state.entities['2']?.dismissed).toBe(true);
    });
  });

  describe('entity adapter sorting', () => {
    it('sorts alerts by level descending, datetime descending, then klass ascending', () => {
      const unsortedAlerts = [
        {
          id: '1',
          level: AlertLevel.Info,
          datetime: { $date: 1000 },
          klass: 'z-alert',
        },
        {
          id: '2',
          level: AlertLevel.Critical,
          datetime: { $date: 2000 },
          klass: 'b-alert',
        },
        {
          id: '3',
          level: AlertLevel.Critical,
          datetime: { $date: 3000 },
          klass: 'a-alert',
        },
        {
          id: '4',
          level: AlertLevel.Warning,
          datetime: { $date: 2000 },
          klass: 'c-alert',
        },
        {
          id: '5',
          level: AlertLevel.Critical,
          datetime: { $date: 2000 },
          klass: 'a-alert',
        },
      ] as unknown as Alert[];

      const state = alertReducer(alertsInitialState, alertsLoaded({ alerts: unsortedAlerts }));

      // Expected sort:
      // 1. Critical, 3000, a-alert (id: 3)
      // 2. Critical, 2000, a-alert (id: 5)
      // 3. Critical, 2000, b-alert (id: 2)
      // 4. Warning, 2000, c-alert (id: 4)
      // 5. Info, 1000, z-alert (id: 1)
      expect(state.ids).toEqual(['3', '5', '2', '4', '1']);
    });
  });
});
