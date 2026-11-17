/**
 * The alerts panel the topbar's bell opens. An alert's ids come from middleware's `key` through the library
 * normalizer (`[alert().key, …]`), so a spec reads the key off `alert.list` rather than predicting it. Alerts of
 * a class with a group summary fold into one entry carrying its newest alert's ids, so a spec acting on one alert
 * must make sure nothing else of its class is in the panel.
 */
import { kebabTestSegment } from './test-id';

export const alertsPanelLocators = {
  /** The filter row's first button, `[tnTestId]="['filter', 'all']"`. Present whenever the panel is open. */
  filterAll: '[data-test="button-filter-all"]',
  /** Shows dismissed alerts instead of open ones. */
  filterDismissed: '[data-test="button-filter-dismissed"]',

  /** The alert's level heading, rendered only while it is not dismissed. */
  level: (key: string): string => `[data-test="text-${kebabTestSegment(key)}-level"]`,
  /** The Dismiss link under an open alert. */
  dismiss: (key: string): string => `[data-test="link-${kebabTestSegment(key)}-dismiss"]`,
  /** The Re-Open link under a dismissed alert. */
  reopen: (key: string): string => `[data-test="link-${kebabTestSegment(key)}-reopen"]`,
} as const;
