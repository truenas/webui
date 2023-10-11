import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export class AsyncDataProvider<T> extends ArrayDataProvider<T> {
  private _subscription = new Subscription();
  private _emptyType$ = new BehaviorSubject<EmptyType>(EmptyType.Loading);

  get emptyType$(): Observable<EmptyType> {
    return this._emptyType$.asObservable();
  }

  constructor(
    private request$: Observable<T[]>,
  ) {
    super();
    this.refresh();
  }

  refresh(): void {
    this._emptyType$.next(EmptyType.Loading);
    this._subscription.add(
      this.request$.subscribe({
        next: (rows) => {
          this.setRows(rows);
          this._emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: () => {
          this.setRows([]);
          this._emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  unsubscribe(): void {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}
