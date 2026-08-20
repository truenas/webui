import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import {
  consolidateAlerts, getAlertConsolidationKey, getConsolidatedDetailMessages, getConsolidatedSummary,
} from 'app/modules/alerts/utils/alert-consolidation.utils';

function makeAlert(overrides: Partial<Alert & EnhancedAlert>): Alert & EnhancedAlert {
  return {
    id: 'id',
    key: 'key',
    klass: AlertClassName.PoolUpgraded,
    level: AlertLevel.Warning,
    formatted: 'Message',
    datetime: { $date: 1 },
    relatedMenuPath: ['storage'],
    // Merging is opt-in: only classes whose enhancement declares a headline are folded together.
    groupSummary: '{count, plural, other {# pools can be upgraded}}',
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

    it('keys off the alert key when the class declares no group headline', () => {
      const first = makeAlert({ id: '1', key: 'pool-a', groupSummary: undefined });
      const second = makeAlert({ id: '2', key: 'pool-b', groupSummary: undefined });

      expect(getAlertConsolidationKey(first)).toContain('pool-a');
      expect(getAlertConsolidationKey(first)).not.toBe(getAlertConsolidationKey(second));
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

    it('does not merge different objects when the class declares no group headline', () => {
      const noHeadline = [
        makeAlert({ id: '1', key: 'pool-a', groupSummary: undefined }),
        makeAlert({ id: '2', key: 'pool-b', groupSummary: undefined }),
      ];

      expect(consolidateAlerts(noHeadline)).toHaveLength(2);
    });

    it('still merges byte-identical duplicates when the class declares no group headline', () => {
      const duplicates = [
        makeAlert({ id: '1', key: 'pool-a', groupSummary: undefined }),
        makeAlert({ id: '2', key: 'pool-a', groupSummary: undefined }),
      ];

      expect(consolidateAlerts(duplicates)).toHaveLength(1);
    });

    // An HA appliance raises the same alert from both controllers: same key, different id.
    const oneObjectTwice = [
      makeAlert({
        id: 'a', key: 'pool-a', node: 'Controller A', formatted: "Pool 'a' is degraded",
      }),
      makeAlert({
        id: 'b', key: 'pool-a', node: 'Controller B', formatted: "Pool 'a' is degraded",
      }),
    ];

    it('counts instances and objects separately', () => {
      const [consolidated] = consolidateAlerts(oneObjectTwice);

      expect(consolidated.duplicateCount).toBe(2);
      expect(consolidated.objectCount).toBe(1);
    });

    it('does not mix alerts of different classes', () => {
      const mixed = [
        makeAlert({ id: '1', klass: AlertClassName.PoolUpgraded }),
        makeAlert({ id: '2', klass: AlertClassName.ZpoolCapacityWarning }),
      ];

      expect(consolidateAlerts(mixed)).toHaveLength(2);
    });
  });

  describe('getConsolidatedSummary', () => {
    const translate = { instant: jest.fn((key: string, params: { count: number }) => `${params.count} pools`) };

    beforeEach(() => translate.instant.mockClear());

    it('counts objects, not instances, so one object reported twice is not "2 pools"', () => {
      const [consolidated] = consolidateAlerts([
        makeAlert({ id: 'a', key: 'pool-a', formatted: "Pool 'a' is degraded" }),
        makeAlert({ id: 'b', key: 'pool-a', formatted: "Pool 'a' is degraded" }),
      ]);

      const summary = getConsolidatedSummary(consolidated, translate as never);

      expect(translate.instant).not.toHaveBeenCalled();
      expect(summary).toBe("Pool 'a' is degraded");
      expect(getConsolidatedDetailMessages(consolidated)).toEqual([]);
    });

    it('uses the group headline once the entry covers several objects', () => {
      const [consolidated] = consolidateAlerts([
        makeAlert({ id: 'a', key: 'pool-a', formatted: "Pool 'a' is degraded" }),
        makeAlert({ id: 'b', key: 'pool-b', formatted: "Pool 'b' is degraded" }),
      ]);

      expect(getConsolidatedSummary(consolidated, translate as never)).toBe('2 pools');
    });
  });
});
