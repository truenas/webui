/**
 * The popup of a form's `tn-file-picker`. Ids derive from the control name kebab-cased, the same base as its
 * `input-<base>` field (`folder-destination`). The popup is a CDK overlay outside the form showing one directory
 * at a time; entry ids carry the name, not the path, so the flows only read the open directory.
 */
import { kebabTestSegment } from './test-id';

export const explorerLocators = {
  /** The folder button at the end of the field. Opens the popup at the explorer's root. */
  toggle: (base: string): string => `[data-test="button-toggle-${base}"]`,

  /** An entry's name cell. Clicking it picks the entry, in single mode. */
  entry: (base: string, name: string): string => `[data-test="option-${base}-${kebabTestSegment(name)}"]`,

  /** An entry's tick box, rendered in multiple mode only. Ticking it picks the entry. */
  entryCheckbox: (base: string, name: string): string => (
    `[data-test="checkbox-${base}-${kebabTestSegment(name)}"]`
  ),

  /** The chevron on a directory's entry. Opens that directory in the popup. */
  open: (base: string, name: string): string => `[data-test="button-navigate-${base}-${kebabTestSegment(name)}"]`,

  /**
   * One segment of the path above the listing. The last one is the directory
   * that is open, so it appearing is the sign that a directory has been opened.
   */
  breadcrumb: (base: string, name: string): string => (
    `[data-test="button-breadcrumb-${base}-${kebabTestSegment(name)}"]`
  ),

  /** The footer's Select. Hands the picked entries to the field and closes the popup. */
  select: (base: string): string => `[data-test="button-select-${base}"]`,
} as const;
