import { Observable } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export class AsyncArrayDataProvider<T> extends ArrayDataProvider<T> {
  emptyType: EmptyType;

  constructor(
    private request$: Observable<T[]>,
  ) {
    super();
    this.refreshData();
  }

  refreshData(): void {
    this.emptyType = EmptyType.Loading;
    this.request$.subscribe({
      next: (rows) => {
        this.setRows(rows);
        this.emptyType = rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData;
      },
      error: () => {
        this.setRows([]);
        this.emptyType = EmptyType.Errors;
      },
    });
  }
}
