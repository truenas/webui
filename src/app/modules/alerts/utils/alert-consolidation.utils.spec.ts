import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import { consolidateAlerts, getAlertConsolidationKey } from 'app/modules/alerts/utils/alert-consolidation.utils';

function makeAlert(overrides: Partial<Alert & EnhancedAlert>): Alert & EnhancedAlert {
  return {
    id: 'id',
    key: 'key',
    klass: AlertClassName.PoolUpgraded,
    level: AlertLevel.Warning,
    formatted: 'Message',
    datetime: { $date: 1 },
    relatedMenuPath: ['storage'],
    ...overrides,
  } as Alert & EnhancedAlert;
}

describe('alert consolidation utils', () => {
  describe('getAlertConsolidationKey', () => {
    it('is the same for alerts of the same class, level and page', () => {
      const first = makeAlert({ id: '1', key: 'pool-a' });
      const second = makeAlert({ id: '2', key: 'pool-b' });

      expect(getAlertConsolidationKey(first)).toBe(getAlertConsolidationKey(second));
    });

    it('differs when the alerts point at different pages', () => {
      const dataPool = makeAlert({ relatedMenuPath: ['storage'] });
      const bootPool = makeAlert({ relatedMenuPath: ['system', 'boot'] });

      expect(getAlertConsolidationKey(dataPool)).not.toBe(getAlertConsolidationKey(bootPool));
    });

    it('falls back to the alert key when there is no class', () => {
      const alert = makeAlert({ klass: undefined, key: 'some-key' });

      expect(getAlertConsolidationKey(alert)).toContain('some-key');
    });
  });

  describe('consolidateAlerts', () => {
    const alerts = [
      makeAlert({
        id: '1', key: 'pool-a', formatted: "Pool 'a' needs an upgrade", datetime: { $date: 10 },
      }),
      makeAlert({
        id: '2', key: 'pool-b', formatted: "Pool 'b' needs an upgrade", datetime: { $date: 30 },
      }),
      makeAlert({
        id: '3', key: 'pool-c', formatted: "Pool 'c' needs an upgrade", datetime: { $date: 20 },
      }),
    ];

    it('collapses alerts of the same kind into one entry', () => {
      const consolidated = consolidateAlerts(alerts);

      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].duplicateCount).toBe(3);
    });

    it('keeps the most recent alert as the representative', () => {
      const consolidated = consolidateAlerts(alerts);

      expect(consolidated[0].id).toBe('2');
    });

    it('carries every id so a single dismiss clears the whole group', () => {
      const consolidated = consolidateAlerts(alerts);

      expect(consolidated[0].allIds).toEqual(['1', '2', '3']);
    });

    it('carries every message, newest first', () => {
      const consolidated = consolidateAlerts(alerts);

      expect(consolidated[0].groupedMessages).toEqual([
        "Pool 'b' needs an upgrade",
        "Pool 'c' needs an upgrade",
        "Pool 'a' needs an upgrade",
      ]);
    });

    it('deduplicates identical messages', () => {
      const duplicates = [
        makeAlert({ id: '1', formatted: 'Same message' }),
        makeAlert({ id: '2', formatted: 'Same message' }),
      ];

      expect(consolidateAlerts(duplicates)[0].groupedMessages).toEqual(['Same message']);
    });

    it('leaves grouped messages unset for a single alert', () => {
      const consolidated = consolidateAlerts([makeAlert({ id: '1' })]);

      expect(consolidated[0].duplicateCount).toBe(1);
      expect(consolidated[0].groupedMessages).toBeUndefined();
    });

    it('does not mix alerts of different classes', () => {
      const mixed = [
        makeAlert({ id: '1', klass: AlertClassName.PoolUpgraded }),
        makeAlert({ id: '2', klass: AlertClassName.ZpoolCapacityWarning }),
      ];

      expect(consolidateAlerts(mixed)).toHaveLength(2);
    });
  });
});
