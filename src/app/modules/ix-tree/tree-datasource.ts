import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  BehaviorSubject, Subject, Observable, map, filter,
  debounceTime, distinctUntilChanged, takeUntil, merge,
} from 'rxjs';
import { TreeFlattener } from 'app/modules/ix-tree/tree-flattener';

export class TreeDataSource<T, F extends { children?: F[] }, K = F> extends DataSource<F> {
  filterPredicate: (node: F, query: string) => boolean;
  sortComparer: (a: T, b: T) => number;
  private filterValue: string;
  private readonly _data = new BehaviorSubject<T[]>([]);
  private readonly filterChanged$ = new BehaviorSubject<string>('');
  private readonly disconnect$ = new Subject<void>();
  private readonly _flattenedData = new BehaviorSubject<F[]>([]);
  private readonly _expandedData = new BehaviorSubject<F[]>([]);
  private readonly _filteredData = new BehaviorSubject<F[]>([]);

  get data(): T[] {
    return this._data.value;
  }

  set data(value: T[]) {
    this._data.next(this.sortComparer ? value.sort(this.sortComparer) : value);
    this.flatNodes();
  }

  private flatNodes(): void {
    if (this.filterValue) {
      this._flattenedData.next(this._filteredData.value);
    } else {
      this._flattenedData.next(this.treeFlattener.flattenNodes(this.data));
    }
    this.treeControl.dataNodes = this._flattenedData.value;
  }

  constructor(
    private treeControl: FlatTreeControl<F, K>,
    private treeFlattener: TreeFlattener<T, F, K>,
    private initialData: T[] = [],
  ) {
    super();
    if (initialData) {
      this.data = this.initialData;
    }
    this.detectFilterChanges();
  }

  override connect(collectionViewer: CollectionViewer): Observable<readonly F[]> {
    return merge(
      collectionViewer.viewChange,
      this.treeControl.expansionModel.changed,
      this._filteredData,
      this._flattenedData,
    )
      .pipe(
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
      .subscribe((filterValue) => {
        if (this.filterValue === filterValue) {
          return;
        }
        this.filterValue = filterValue;
        this._filteredData.next(this.filterData(this.treeFlattener.flattenNodes(this.data), filterValue));
        this.flatNodes();
      });
  }

  filterData(value: F[], query: string): F[] {
    return value.filter((item) => {
      const matches = this.filterPredicate(item, query);
      if (item.children.length && matches) {
        item.children = this.filterData(item.children, query);
      }
      console.info('filterPredicate', item, query, this.filterPredicate(item, query));
      return matches;
    });
  }
}
