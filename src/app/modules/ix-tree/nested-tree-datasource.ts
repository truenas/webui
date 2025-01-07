import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import {
  Observable, BehaviorSubject, merge, Subject,
} from 'rxjs';
import {
  map, distinctUntilChanged, debounceTime, takeUntil, filter,
} from 'rxjs/operators';

/**
 * Data source for nested tree.
 */
export class NestedTreeDataSource<T extends { children?: T[] }> extends DataSource<T> {
  filterPredicate: (data: T[], query: string) => T[];
  sortComparer?: (a: T, b: T) => number;
  private filterValue: string;
  private readonly filterChanged$ = new BehaviorSubject<string>('');
  private readonly _data = new BehaviorSubject<T[]>([]);
  private readonly _filteredData = new BehaviorSubject<T[]>([]);
  private readonly disconnect$ = new Subject<void>();

  get data(): T[] {
    return this._data.value;
  }

  set data(value: T[]) {
    this._data.next(this.sortComparer ? this.sort(value) : value);
  }

  constructor(private initialData?: T[]) {
    super();

    if (initialData) {
      this.data = this.initialData;
    }

    this.detectFilterChanges();
  }

  override connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return merge(
      collectionViewer.viewChange,
      this._data,
      this._filteredData,
    ).pipe(
      map(() => (this.filterValue ? this._filteredData.value : this.data)),
    );
  }

  disconnect(): void {
    this.disconnect$.next();
    this.disconnect$.complete();
  }

  /**
   * Filter the data based on the query
   * @param query
   */
  filter(query: string): void {
    this.filterChanged$.next(query);
  }

  private detectFilterChanges(): void {
    this.filterChanged$.pipe(
      filter(() => !!this.filterPredicate),
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.disconnect$),
    ).subscribe((changedValue: string) => {
      if (this.filterValue === changedValue) {
        return;
      }
      this.filterValue = changedValue;
      this._filteredData.next(this.filterPredicate(this.data, changedValue));
    });
  }

  private sort(value: T[]): T[] {
    return value.map((item) => {
      if (item.children.length) {
        item.children.sort(this.sortComparer);
      }
      this.sort(item.children);
      return item;
    });
  }
}
