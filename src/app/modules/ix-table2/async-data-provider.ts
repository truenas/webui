import { Observable, OperatorFunction } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { BaseDataProvider } from 'app/modules/ix-table2/base-data-provider';

export class AsyncDataProvider<T> extends BaseDataProvider<T> {
  constructor(
    private request$: Observable<ApiCallDirectory[ApiCallMethod]['response']>,
  ) {
    super();
  }

  load<K>(transformFunction?: () => OperatorFunction<K, T[]>): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      (transformFunction ? this.request$.pipe(transformFunction()) : this.request$).subscribe({
        next: (rows: T[]) => {
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
