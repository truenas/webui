import { Observable } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { BaseDataProvider } from 'app/modules/ix-table2/base-data-provider';

export class AsyncDataProvider<T> extends BaseDataProvider<T> {
  constructor(
    private request$: Observable<T[]>,
  ) {
    super();
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.request$.subscribe({
        next: (rows) => {
          this.setRows(rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: () => {
          this.setRows([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }
}
