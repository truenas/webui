import { Observable } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { BaseDataProvider } from 'app/modules/ix-table2/classes/base-data-provider';

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
        error: () => {
          this.loadedRows = [];
          this.setRows([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  setFilter(filter: { query: string; columns: (keyof T)[] }): void {
    if (!filter) {
      this.totalRows = this.loadedRows.length;
      this.setRows(this.loadedRows);
    }
    const filteredRows = this.loadedRows.filter((row) => {
      for (const column of filter.columns) {
        if (row[column].toString().trim().toLowerCase().includes(filter.query.trim().toLowerCase())) {
          return true;
        }
      }
      return false;
    });
    this.totalRows = filteredRows.length;
    this.setRows(filteredRows);
    this.emptyType$.next(!filteredRows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
  }
}
