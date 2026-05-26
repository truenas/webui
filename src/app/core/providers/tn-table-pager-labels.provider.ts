import { computed, inject, Provider } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { TN_TABLE_PAGER_LABELS, type TnTablePagerLabels } from '@truenas/ui-components';

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
    useFactory: () => {
      const translate = inject(TranslateService);
      const langChange = toSignal(translate.onLangChange, { initialValue: null });
      return computed<TnTablePagerLabels>(() => {
        // Read the lang-change signal so the computed re-runs after each language switch.
        langChange();
        return Object.fromEntries(
          Object.entries(labelKeys).map(([key, value]) => [key, translate.instant(value)]),
        ) as TnTablePagerLabels;
      });
    },
  };
}
