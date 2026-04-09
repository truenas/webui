import { Observable } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';

export class AsyncDataProvider<T> extends BaseDataProvider<T> {
  private loadedRows: T[] = [];

  constructor(
    private request$: Observable<T[]>,
  ) {
    super();
  }

  load(): void {
    this.subscription.add(
      this.request$.subscribe({
        next: (rows) => {
          this.loadedRows = rows;
          this.setRows(rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: (error: unknown) => {
          this.loadedRows = [];
          this.setRows([]);
          console.error(error);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  override setFilter(filter: TableFilter<T>): void {
    super.setFilter({ ...filter, list: filter.list || this.loadedRows });
  }
}
