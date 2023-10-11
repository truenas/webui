import { Observable, Subscription } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export class AsyncDataProvider<T> extends ArrayDataProvider<T> {
  private subscription = new Subscription();
  private _emptyType: EmptyType;
  private _rowsWithoutFilter: T[] = [];

  get rowsWithoutFilter(): T[] {
    return this._rowsWithoutFilter;
  }

  get emptyType(): EmptyType {
    return this._emptyType;
  }

  constructor(
    private request$: Observable<T[]>,
  ) {
    super();
    this.refresh();
  }

  refresh(): void {
    this._emptyType = EmptyType.Loading;
    this.subscription.add(
      this.request$.subscribe({
        next: (rows) => {
          this.setRows(rows);
          this._rowsWithoutFilter = rows;
          this._emptyType = rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData;
        },
        error: () => {
          this.setRows([]);
          this._rowsWithoutFilter = [];
          this._emptyType = EmptyType.Errors;
        },
      }),
    );
  }

  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
