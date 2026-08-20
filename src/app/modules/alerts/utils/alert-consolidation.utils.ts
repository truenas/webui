import { uniq } from 'lodash-es';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';

export type ConsolidatedAlert<T> = T & {
  /** Number of alerts represented by this entry. */
  duplicateCount: number;
  /** Ids of every alert in the group, so a single dismiss clears all of them. */
  allIds: string[];
  /**
   * Distinct messages in the group, newest first. Only set for real groups.
   * Duplicates are collapsed, so this can be shorter than `duplicateCount`:
   * the count is instances, this is the messages they carry.
   */
  groupedMessages?: string[];
};

/**
 * Alerts consolidate when they report the same kind of problem, even about different
 * objects - one banner for four pools that need upgrading instead of four banners.
 *
 * The level and the page the alert points at are part of the key so that alert classes
 * with conditional enhancements (boot pool vs data pool capacity, for example) are not
 * folded into a single entry that would link to the wrong page.
 *
 * `klass` is the grouping unit; `key` is only a fallback for alerts that arrive without one.
 */
export function getAlertConsolidationKey(alert: Alert & EnhancedAlert): string {
  const menuPath = alert.bannerMenuPath ?? alert.relatedMenuPath ?? [];
  return [alert.klass || alert.key, alert.level, menuPath.join('/')].join('|');
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
