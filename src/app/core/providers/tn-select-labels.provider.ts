import { Provider } from '@angular/core';
import { TN_SELECT_LABELS, type TnSelectLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';

/**
 * App-wide defaults for the copy `tn-select` renders itself — the trigger placeholder, the
 * empty-dropdown message and the "select all" row.
 *
 * Provided as a signal so the strings re-resolve when the language changes, the same way the
 * `translate` pipe would have if they were bound per call site. An explicit input on a
 * `<tn-select>` still wins, which is how a field with its own wording opts out.
 */
export function provideTnSelectLabels(): Provider {
  return {
    provide: TN_SELECT_LABELS,
    useFactory: () => translated<TnSelectLabels>((translate) => ({
      placeholder: translate.instant(tnSelectLabels.placeholder),
      noOptions: translate.instant(tnSelectLabels.noOptions),
      selectAll: translate.instant(tnSelectLabels.selectAll),
    })),
  };
}
