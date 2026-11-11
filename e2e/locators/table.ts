/**
 * The controls `tn-table` draws on every row, which no webui template can tag: a `[selectable]` row's tick box and
 * an `[expandable]` row's chevron. Since `@truenas/ui-components` 0.8.13 both are scoped by the row tag (the
 * `[rowTestId]` value after `row-`): `row-disk-sda` has `checkbox-select-disk-sda` and `button-expand-disk-sda`, in
 * table and card mode; no `[rowTestId]`, no ids. Pass the tag exactly as the screen's locator module builds it;
 * this re-runs it through the library normalizer like `composeTestId`, which leaves a normalized tag unchanged.
 */
import { kebabTestSegment } from './test-id';

export const tableLocators = {
  /**
   * A row's tick box. The id sits on the checkbox's `<label>`, which Playwright
   * retargets to the input for `check()`, `uncheck()` and `toBeChecked()`.
   */
  selectRow: (rowTag: string): string => `[data-test="checkbox-select-${kebabTestSegment(rowTag)}"]`,

  /** A row's expand chevron. Rendered only on a row the table can expand. */
  expandRow: (rowTag: string): string => `[data-test="button-expand-${kebabTestSegment(rowTag)}"]`,
} as const;
