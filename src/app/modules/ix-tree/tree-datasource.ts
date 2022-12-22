import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { TreeControl } from '@angular/cdk/tree';
import {
  BehaviorSubject, Subject, Observable, map, filter,
  debounceTime, distinctUntilChanged, takeUntil, mergeWith,
} from 'rxjs';

export class IxTreeDataSource<T> extends DataSource<T> {
  filterPredicate: (data: T[], query: string) => T[];
  private filterValue: string;
  private readonly _data = new BehaviorSubject<T[]>([]);
  private readonly _filteredData = new BehaviorSubject<T[]>([]);
  private readonly filterChanged$ = new BehaviorSubject<string>('');
  private readonly disconnect$ = new Subject<void>();

  get data(): T[] {
    return this._data.value;
  }

  set data(value: T[]) {
    this._data.next(value);
    this.treeControl.dataNodes = value;
  }

  constructor(
    private treeControl: TreeControl<T>,
    private initialData: T[] = [],
  ) {
    super();
    if (initialData) {
      this.data = this.initialData;
    }
    this.detectFilterChanges();
  }

  override connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
    return collectionViewer.viewChange.pipe(
      mergeWith(this._data, this._filteredData),
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
    this.filterChanged$
      .pipe(
        filter(() => !!this.filterPredicate),
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.disconnect$),
      )
      .subscribe((changedValue: string) => {
        if (this.filterValue === changedValue) {
          return;
        }
        this.filterValue = changedValue;
        this._filteredData.next(this.filterPredicate(this.data, changedValue));
      });
  }
}
