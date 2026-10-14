/**
 * The alerts panel the topbar's bell opens.
 *
 * An alert's ids are built from middleware's `key` for it, run through the
 * library's normalizer: `<ix-alert>` tags its controls `[alert().key, …]`. The
 * key is middleware's, so a spec reads it off `alert.list` rather than
 * predicting it.
 *
 * The panel folds alerts of one class into a single entry when the class has a
 * group summary, and the entry carries the ids of its newest alert. A spec that
 * acts on one alert has to make sure nothing else of its class is in the panel.
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
