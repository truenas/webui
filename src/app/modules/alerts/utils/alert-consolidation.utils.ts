import { uniq } from 'lodash-es';
import { Alert } from 'app/interfaces/alert.interface';
import { ConsolidatedAlert, EnhancedAlert } from 'app/interfaces/smart-alert.interface';

/**
 * Alerts consolidate when they report the same kind of problem, even about different
 * objects - one banner for four pools that need upgrading instead of four banners.
 *
 * Merging is opt-in: only classes whose enhancement declares a `groupSummary` are folded
 * together, because that headline is the only honest thing to title a merged row with.
 * Without one the row would show the newest alert's own text - naming one object while
 * standing for several, and dismissing all of them. Those classes keep the old behaviour
 * of merging byte-identical duplicates only, and a per-object class added to the registry
 * later cannot inherit merging by accident.
 *
 * The level and the page the alert points at are part of the key so that alert classes
 * with conditional enhancements (boot pool vs data pool capacity, for example) are not
 * folded into a single entry that would link to the wrong page.
 */
export function getAlertConsolidationKey(alert: Alert & EnhancedAlert): string {
  if (!alert.groupSummary) {
    return `key|${alert.key}`;
  }

  const menuPath = alert.bannerMenuPath ?? alert.relatedMenuPath ?? [];
  return ['class', alert.klass, alert.level, menuPath.join('/')].join('|');
}

/**
 * Collapses alerts of the same kind into one entry each, keeping the most recent alert
 * as the representative and carrying the ids and messages of the whole group.
 */
export function consolidateAlerts<T extends Alert & EnhancedAlert>(alerts: T[]): ConsolidatedAlert<T>[] {
  const groups = new Map<string, T[]>();

  for (const alert of alerts) {
    const groupKey = getAlertConsolidationKey(alert);
    const group = groups.get(groupKey);
    if (group) {
      group.push(alert);
    } else {
      groups.set(groupKey, [alert]);
    }
  }

  return Array.from(groups.values()).map((group) => {
    const newestFirst = [...group].sort((a, b) => (b.datetime?.$date || 0) - (a.datetime?.$date || 0));
    const representative = newestFirst[0];

    return {
      ...representative,
      duplicateCount: group.length,
      allIds: group.map((alert) => alert.id),
      // Left out for single alerts so consumers can fall back to the alert's own message.
      // `uniq`: alerts of one class about the same object repeat their text verbatim, and
      // listing the same line N times says nothing. The badge still reports N instances.
      ...(group.length > 1 ? { groupedMessages: uniq(newestFirst.map((alert) => alert.formatted)) } : {}),
    };
  });
}
