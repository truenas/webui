import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_TABLE_PAGER_LABELS, type TnTablePagerLabels } from '@truenas/ui-components';
import { translatedSignal } from 'app/modules/translate/translated-signal';

const labelKeys: Record<keyof TnTablePagerLabels, string> = {
  itemsPerPage: T('Items per page'),
  of: T('of'),
  firstPage: T('First Page'),
  previousPage: T('Previous Page'),
  nextPage: T('Next Page'),
  lastPage: T('Last Page'),
  tablePagination: T('Table Pagination'),
};

export function provideTnTablePagerLabels(): Provider {
  return {
    provide: TN_TABLE_PAGER_LABELS,
    useFactory: () => translatedSignal<TnTablePagerLabels>((translate) => ({
      itemsPerPage: translate.instant(labelKeys.itemsPerPage),
      of: translate.instant(labelKeys.of),
      firstPage: translate.instant(labelKeys.firstPage),
      previousPage: translate.instant(labelKeys.previousPage),
      nextPage: translate.instant(labelKeys.nextPage),
      lastPage: translate.instant(labelKeys.lastPage),
      tablePagination: translate.instant(labelKeys.tablePagination),
    })),
  };
}
