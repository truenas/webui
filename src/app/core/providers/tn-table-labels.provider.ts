import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_TABLE_LABELS, type TnTableLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnTableLabels, string> = {
  sortBy: T('Sort by'),
  unsorted: T('Unsorted'),
  moreFields: T('More fields'),
  details: T('Details'),
  expand: T('Expand'),
  actions: T('Actions'),
};

/**
 * Translates the chrome `tn-table` renders in card mode — the sort control, its "unsorted"
 * option, the more-fields toggle and the visually-hidden expand/actions names.
 *
 * Like `provideTnDialogLabels`, these had no input to bind: they were literals in the library
 * template, so every table announced them in English. Distinct from `[emptyMessage]` /
 * `[loadingMessage]`, which are real inputs and stay bound per table.
 */
export function provideTnTableLabels(): Provider {
  return {
    provide: TN_TABLE_LABELS,
    useFactory: () => translated<TnTableLabels>((translate) => ({
      sortBy: translate.instant(labelKeys.sortBy),
      unsorted: translate.instant(labelKeys.unsorted),
      moreFields: translate.instant(labelKeys.moreFields),
      details: translate.instant(labelKeys.details),
      expand: translate.instant(labelKeys.expand),
      actions: translate.instant(labelKeys.actions),
    })),
  };
}
