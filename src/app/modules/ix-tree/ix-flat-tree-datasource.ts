import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource } from '@angular/material/tree';
import {
  BehaviorSubject, Subject, Observable, debounceTime, distinctUntilChanged, takeUntil, filter, map,
} from 'rxjs';
import { IxTreeFlattener } from 'app/modules/ix-tree/ix-tree-flattener';

/**
 * Data source for flat tree.
 */
export class IxFlatTreeDataSource<T, F> extends DataSource<F> {
  filterPredicate: (data: T[], query: string) => T[];
  private filterValue: string;
  private readonly _flattenedData = new BehaviorSubject<F[]>([]);
  private readonly _expandedData = new BehaviorSubject<F[]>([]);
  private readonly _data = new BehaviorSubject<T[]>([]);
  private readonly _filteredData = new BehaviorSubject<T[]>([]);
  private readonly filterChanged$ = new BehaviorSubject<string>('');
  private readonly disconnect$ = new Subject<void>();
  private readonly shadowDataSource = new MatTreeFlatDataSource<T, F>(this.treeControl, this.treeFlattener);

  constructor(
    private treeControl: FlatTreeControl<F>,
    private treeFlattener: IxTreeFlattener<T, F>,
    private initialData: T[] = [],
  ) {
    super();
    if (initialData) {
      this.data = this.initialData;
    }
    this.shadowDataSource.data = this.data;
    this.detectFilterChanges();
  }

  get data(): T[] {
    return this._data.value;
  }
  set data(value: T[]) {
    this._data.next(value);
    this.flatNodes();
  }

  connect(collectionViewer: CollectionViewer): Observable<F[]> {
    return this.shadowDataSource.connect(collectionViewer).pipe(
      map(() => {
        this._expandedData.next(this.treeFlattener.expandFlattenedNodes(this._flattenedData.value, this.treeControl));
        return this._expandedData.value;
      }),
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
        this.flatNodes();
      });
  }

  private flatNodes(): void {
    this._flattenedData.next(this.treeFlattener.flattenNodes(
      this.filterValue ? this._filteredData.value : this.data,
    ));
    this.treeControl.dataNodes = this._flattenedData.value;
  }
}
