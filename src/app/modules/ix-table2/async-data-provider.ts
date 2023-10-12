import { BehaviorSubject, Observable, Subscription, map } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export class AsyncDataProvider<T> extends ArrayDataProvider<T> {
  private subscription = new Subscription();
  readonly emptyType$ = new BehaviorSubject<EmptyType>(EmptyType.Loading);

  get isLoading$(): Observable<boolean> {
    return this.emptyType$.pipe(map((emptyType) => emptyType === EmptyType.Loading));
  }

  get isError$(): Observable<boolean> {
    return this.emptyType$.pipe(map((emptyType) => emptyType === EmptyType.Errors));
  }

  constructor(
    private request$: Observable<T[]>,
  ) {
    super();
    this.refresh();
  }

  refresh(): void {
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

  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
