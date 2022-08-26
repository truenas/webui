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
export class IxNestedTreeDataSource<T extends { children?: T[] }> extends DataSource<T> {
  filterPredicate: (data: T[], query: string) => T[];
  private filterValue: string;
  private readonly filterChanged$ = new BehaviorSubject<string>('');
  private readonly _data = new BehaviorSubject<T[]>([]);
  private readonly _filteredData = new BehaviorSubject<T[]>([]);
  private readonly disconnect$ = new Subject<void>();

  get data(): T[] {
    return this._data.value;
  }
  set data(value: T[]) {
    this._data.next(value);
  }

  get filteredData(): T[] {
    return this._filteredData.value;
  }
  set filteredData(value: T[]) {
    this._filteredData.next(value);
  }

  override connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return merge(...([collectionViewer.viewChange, this._data, this._filteredData] as Observable<unknown>[])).pipe(
      map(() => (this.filterValue ? this.filteredData : this.data)),
    );
  }

  disconnect(): void {
    this.disconnect$.next();
    this.disconnect$.complete();
  }

  constructor(private initialData: T[]) {
    super();
    this.data = this.initialData;

    this.detectFilterChanges();
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
      this.filteredData = this.filterPredicate(this.data, changedValue);
    });
  }
}
