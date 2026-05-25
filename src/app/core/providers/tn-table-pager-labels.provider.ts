import { computed, inject, Provider } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { TN_TABLE_PAGER_LABELS, type TnTablePagerLabels } from '@truenas/ui-components';
import { startWith } from 'rxjs';

export function provideTnTablePagerLabels(): Provider {
  return {
    provide: TN_TABLE_PAGER_LABELS,
    useFactory: () => {
      const translate = inject(TranslateService);
      const langChange = toSignal(translate.onLangChange.pipe(startWith(null)));
      return computed<TnTablePagerLabels>(() => {
        // Read the signal so the computed re-evaluates on every language change.
        langChange();
        return {
          itemsPerPage: translate.instant(T('Items per page')) as string,
          of: translate.instant(T('of')) as string,
          firstPage: translate.instant(T('First Page')) as string,
          previousPage: translate.instant(T('Previous Page')) as string,
          nextPage: translate.instant(T('Next Page')) as string,
          lastPage: translate.instant(T('Last Page')) as string,
          tablePagination: translate.instant(T('Table Pagination')) as string,
        };
      });
    },
  };
}
