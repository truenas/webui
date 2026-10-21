/**
 * The controls `tn-table` draws itself on every row, which no webui template can
 * tag: the selection tick box of a `[selectable]` table and the expand chevron of
 * an `[expandable]` one.
 *
 * Since `@truenas/ui-components` 0.8.13 both are scoped by the row's own tag, the
 * value its `[rowTestId]` resolves to and the part of the row's id after `row-`.
 * So a row `row-disk-sda` has the tick box `checkbox-select-disk-sda` and the
 * chevron `button-expand-disk-sda`, in table mode and in card mode alike. A table
 * that binds no `[rowTestId]` gives neither control an id.
 *
 * Pass the row tag exactly as the screen's own locator module builds it for the
 * row. Each screen knows which normalizer its tag went through (see
 * `test-id.ts`); this module only adds the control's segment in front, and runs
 * the tag through the library's normalizer as `composeTestId` does, which leaves
 * an already-normalized tag unchanged.
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
