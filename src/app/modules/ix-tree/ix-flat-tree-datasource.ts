import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  BehaviorSubject, Subject, Observable, merge, debounceTime, distinctUntilChanged, takeUntil, map, filter,
} from 'rxjs';
import { IxTreeFlattener } from 'app/modules/ix-tree/ix-tree-flattener';

/**
 * Data source for flat tree.
 */
export class IxFlatTreeDataSource<T, F, K = F> extends DataSource<F> {
  filterPredicate: (data: T[], query: string) => T[];
  private filterValue: string;
  private readonly _flattenedData = new BehaviorSubject<F[]>([]);
  private readonly _expandedData = new BehaviorSubject<F[]>([]);
  private readonly _data: BehaviorSubject<T[]>;
  private readonly _filteredData = new BehaviorSubject<T[]>([]);
  private readonly filterChanged$ = new BehaviorSubject<string>('');
  private readonly disconnect$ = new Subject<void>();

  constructor(
    private treeControl: FlatTreeControl<F, K>,
    private treeFlattener: IxTreeFlattener<T, F, K>,
    private initialData: T[] = [],
  ) {
    super();
    this._data = new BehaviorSubject<T[]>(this.initialData);
    this.flatNodes();
    this.detectFilterChanges();
  }

  setData(value: T[]): void {
    this._data.next(value);
    this.flatNodes();
  }

  getData(): T[] {
    return this._data.getValue();
  }

  connect(collectionViewer: CollectionViewer): Observable<F[]> {
    return merge([
      collectionViewer.viewChange,
      this.treeControl.expansionModel.changed,
      this._data,
      this._flattenedData,
    ]).pipe(
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
        this._filteredData.next(this.filterPredicate(this.getData(), changedValue));
        this.flatNodes();
      });
  }

  private flatNodes(): void {
    this._flattenedData.next(this.treeFlattener.flattenNodes(
      this.filterValue ? this._filteredData.value : this.getData(),
    ));
    this.treeControl.dataNodes = this._flattenedData.value;
  }
}
