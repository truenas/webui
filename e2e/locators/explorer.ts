/**
 * The popup of the `tn-file-picker` that every `ix-explorer` renders.
 *
 * `ix-explorer` passes its control name to the picker as `testId`, and the
 * picker builds every id below from that base. The base is the control name
 * kebab-cased, the same one its typable field is `input-<base>` by:
 * `folder-destination` for `folder_destination`.
 *
 * The popup renders in a CDK overlay outside the form, and lists one directory
 * at a time. An entry's ids carry its name, never its path, so two directories
 * holding the same name give the same ids. The flows only ever read the
 * directory that is open.
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
