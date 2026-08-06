import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

/**
 * Default trigger strings for `tn-select`.
 *
 * `tn-select` ships its own defaults (`'Select an option'` / `'No options available'`), but they
 * are plain English literals inside the library — they never reach webui's `TranslateService`, so
 * a non-English user sees English. Passing these keys through the `translate` pipe is what makes
 * them translatable; **do not drop the bindings assuming the library default covers it.**
 *
 * Kept here rather than repeated per template so the wording is pinned in one place and every
 * migrated select matches.
 *
 * @example
 * ```html
 * <tn-select
 *   [placeholder]="tnSelectLabels.placeholder | translate"
 *   [noOptionsLabel]="tnSelectLabels.noOptions | translate"
 * ></tn-select>
 * ```
 */
export const tnSelectLabels = {
  placeholder: T('Select an option'),
  /** Deliberately shorter than the library's 'No options available'. */
  noOptions: T('No options'),
};
