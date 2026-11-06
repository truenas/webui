import { TranslateService } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertWithDuplicates, ConsolidatedAlert, EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import { getAlertDuplicateKey } from 'app/modules/alerts/utils/alert-duplicate-key.utils';
import { getAlertBannerMenuPaths } from 'app/modules/alerts/utils/alert-menu-path.utils';
import { getAlertSummary } from 'app/modules/alerts/utils/alert-summary.utils';

/**
 * Alerts of the same kind about different objects consolidate into one row. Opt-in: only classes
 * with a `groupSummary` merge, since a merged row titled with one alert's text would name one object
 * while dismissing several; the rest merge byte-identical duplicates only. The level and target pages
 * are in the key so conditional enhancements (boot vs data pool capacity) don't link to the wrong page.
 */
export function getAlertConsolidationKey(alert: Alert & EnhancedAlert): string {
  if (!alert.groupSummary) {
    // Qualified by class, not `alert.key` alone: middleware derives the key from the alert
    // arguments, so two classes raised against the same object share it (see the util).
    return `key|${getAlertDuplicateKey(alert)}`;
  }

  const menuPaths = getAlertBannerMenuPaths(alert).map((path) => path.join('/'));
  return ['class', alert.klass, alert.level, menuPaths.join(',')].join('|');
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
      objectCount: new Set(group.map((alert) => alert.key)).size,
      allIds: group.map((alert) => alert.id),
      // Left out for single alerts so consumers can fall back to the alert's own message.
      // `uniq`: alerts of one class about the same object repeat their text verbatim, and
      // listing the same line N times says nothing. The badge still reports N instances.
      ...(group.length > 1 ? { groupedMessages: uniq(newestFirst.map((alert) => alert.formatted)) } : {}),
    };
  });
}

/**
 * Headline for a consolidated entry: the class's group summary when it stands for several
 * alerts, otherwise the first sentence of the alert's own message.
 *
 * Shared by the page banners and the alerts dropdown so the two cannot drift apart.
 */
export function getConsolidatedSummary(alert: AlertWithDuplicates, translate: TranslateService): string {
  // Counted in objects, not instances: the headlines read "{count} pools", and one pool
  // reporting twice (both HA controllers) is still one pool.
  if (alert.objectCount > 1 && alert.groupSummary) {
    return translate.instant(alert.groupSummary, { count: alert.objectCount });
  }
  return getAlertSummary(alert.formatted);
}

/**
 * Messages listed under the headline, one per object the entry covers.
 *
 * Empty when the entry covers a single object: it expands in place, so listing its message
 * here would repeat the opening sentence already shown as the headline.
 */
export function getConsolidatedDetailMessages(alert: AlertWithDuplicates): string[] {
  if (alert.objectCount <= 1) {
    return [];
  }
  return alert.groupedMessages ?? [alert.formatted];
}
