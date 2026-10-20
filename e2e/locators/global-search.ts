/**
 * Global search: the "Search UI" box in the topbar and the overlay it opens.
 *
 * The topbar's box is only a trigger. Opening it attaches an overlay holding a
 * second, identical box on top of it, and hides the first with `visibility:
 * hidden` so the layout does not shift. Both inputs are `input-global-search`,
 * so while the overlay is open the id matches twice, and only the overlay's copy
 * is visible.
 *
 * Every result is tagged `[tnTestId]="['search-result', hierarchy.join('-')]"`
 * with `tnTestIdType="text"`, whichever section lists it — a page chosen once is
 * the same id under UI and under Recent Searches. The hierarchy is the
 * breadcrumb the result shows, `System › Services`, in English.
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
