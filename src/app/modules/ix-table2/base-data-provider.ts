import _ from 'lodash';
import { BehaviorSubject, Observable, Subscription, map } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';

export class BaseDataProvider<T> implements DataProvider<T> {
  readonly emptyType$ = new BehaviorSubject<EmptyType>(EmptyType.Loading);

  get isLoading$(): Observable<boolean> {
    return this.emptyType$.pipe(map((emptyType) => emptyType === EmptyType.Loading));
  }

  get isError$(): Observable<boolean> {
    return this.emptyType$.pipe(map((emptyType) => emptyType === EmptyType.Errors));
  }

  currentPage$ = new BehaviorSubject<T[]>([]);
  rows: T[] = [];
  expandedRow: T;
  totalRows = 0;

  sorting: TableSort<T> = {
    propertyName: null,
    direction: null,
    active: null,
  };

  pagination: TablePagination = {
    pageNumber: null,
    pageSize: null,
  };

  protected subscription = new Subscription();

  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  setRows(rows: T[]): void {
    this.rows = rows;
    this.totalRows = rows.length;
    this.updateCurrentPage();
  }

  setSorting(sorting: TableSort<T>): void {
    this.sorting = sorting;
    this.updateCurrentPage();
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.updateCurrentPage();
  }

  private updateCurrentPage(): void {
    this.currentPage$.next(paginateFn(sortFn(this.rows, this.sorting), this.pagination));
  }
}

export function sortFn<T>(rows: T[], sorting: TableSort<T>): T[] {
  const sorted = rows;
  const direction = sorting.direction;
  const propertyName = sorting.propertyName;
  const sortBy = sorting.sortBy;

  if (direction === null || propertyName === null) {
    return sorted;
  }
  if (sortBy) {
    return direction === SortDirection.Desc ? _.sortBy(sorted, sortBy).reverse() : _.sortBy(sorted, sortBy);
  }

  return _.orderBy(sorted, propertyName, direction);
}

export function  paginateFn<T>(rows: T[], pagination: TablePagination): T[] {
  const paginated = rows;
  const pageNumber = pagination.pageNumber;
  const pageSize = pagination.pageSize;

  if (pageNumber === null || pageSize === null) {
    return paginated;
  }

  return paginated.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}
