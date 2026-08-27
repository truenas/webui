import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

/**
 * Translation keys for the copy `tn-select` renders identically in every select in the app.
 *
 * The library ships English literals (`'Select an option'` / `'No options available'`) that never
 * reach webui's `TranslateService`. Since 0.7.x it resolves them through the `TN_SELECT_LABELS`
 * token instead, so these keys are wired **once** at the app root by `provideTnSelectLabels()` —
 * per-call-site `[placeholder]` / `[noOptionsLabel]` bindings are no longer needed and only repeat
 * the same two attribute rows on every `<tn-select>`.
 *
 * Bind them on a select only where that particular field needs its own wording.
 */
export const tnSelectLabels = {
  placeholder: T('Select an option'),
  /** Deliberately shorter than the library's 'No options available'. */
  noOptions: T('No options'),
  selectAll: T('Select All'),
};
