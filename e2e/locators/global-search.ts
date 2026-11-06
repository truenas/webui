/**
 * Global search: the topbar's "Search UI" box and its overlay. The topbar box is only a trigger: opening it lays
 * an identical box over it and hides the first with `visibility: hidden`, so `input-global-search` matches twice
 * and only the overlay's copy is visible. Results are `text` ids `['search-result', hierarchy.join('-')]`, the
 * English breadcrumb (`System › Services`), the same under UI and Recent Searches.
 */
import { kebabTestSegment } from './test-id';

export const globalSearchLocators = {
  /** The topbar's box while search is closed; the overlay's box, on top of it, while it is open. */
  input: '[data-test="input-global-search"]',

  /** A section heading, `[tnTestId]="['search-section', section.value]"`. Rendered only while the section is listed. */
  section: {
    ui: '[data-test="text-search-section-ui"]',
    help: '[data-test="text-search-section-help"]',
    recentSearches: '[data-test="text-search-section-recent-searches"]',
  },

  /** The result whose breadcrumb is `hierarchy`. Choosing it navigates, or opens a link for a Help result. */
  result: (hierarchy: readonly string[]): string => (
    `[data-test="text-search-result-${kebabTestSegment(hierarchy.join('-'))}"]`
  ),
  /** Every result in every section. */
  anyResult: '[data-test^="text-search-result-"]',

  /** The ✕ on a Recent Searches entry, a `tn-icon` with `[testId]="['remove-recent-search', hierarchy.join('-')]"`. */
  removeRecentSearch: (hierarchy: readonly string[]): string => (
    `[data-test="icon-remove-recent-search-${kebabTestSegment(hierarchy.join('-'))}"]`
  ),
} as const;
