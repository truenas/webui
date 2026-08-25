import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_SELECT_LABELS, type TnSelectLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnSelectLabels, string> = {
  placeholder: T('Select an option'),
  /** Deliberately shorter than the library's 'No options available'. */
  noOptions: T('No options'),
  selectAll: T('Select All'),
};

/**
 * Translates the copy every `tn-select` shares.
 *
 * The library ships no translation files, so its English defaults never reach
 * `TranslateService` — which used to mean every `<tn-select>` in webui had to rebind
 * `[placeholder]` and `[noOptionsLabel]` from a shared constant, two extra attribute
 * rows apiece. Providing them here once covers every select in the app; a select that
 * genuinely needs its own wording still binds the input, which wins over this token.
 */
export function provideTnSelectLabels(): Provider {
  return {
    provide: TN_SELECT_LABELS,
    useFactory: () => translated<TnSelectLabels>((translate) => ({
      placeholder: translate.instant(labelKeys.placeholder),
      noOptions: translate.instant(labelKeys.noOptions),
      selectAll: translate.instant(labelKeys.selectAll),
    })),
  };
}
