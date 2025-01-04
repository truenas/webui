import { EventEmitter } from '@angular/core';
import { orderBy, sortBy } from 'lodash-es';
import {
  BehaviorSubject, Observable, Subscription, map,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { filterTableRows } from 'app/modules/ix-table/utils';

export class BaseDataProvider<T> implements DataProvider<T> {
  readonly emptyType$ = new BehaviorSubject<EmptyType>(EmptyType.Loading);
  readonly controlsStateUpdated = new EventEmitter<void>();

  get isLoading$(): Observable<boolean> {
    return this.emptyType$.pipe(map((emptyType) => emptyType === EmptyType.Loading));
  }

  get isError$(): Observable<boolean> {
    return this.emptyType$.pipe(map((emptyType) => emptyType === EmptyType.Errors));
  }

  get currentPageCount$(): Observable<number> {
    return this.currentPage$.pipe(map((currentPage) => currentPage.length));
  }

  currentPage$ = new BehaviorSubject<T[]>([]);
  expandedRow$ = new BehaviorSubject<T | null>(null);
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
  private allRows: T[] = [];

  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  setRows(rows: T[]): void {
    this.allRows = rows;
    this.totalRows = rows.length;
    this.updateCurrentPage(this.allRows);
  }

  setSorting(sorting: TableSort<T>): void {
    this.sorting = sorting;
    this.updateCurrentPage(this.allRows);
    this.controlsStateUpdated.emit();
  }

  setFilter(filter: TableFilter<T>): void {
    const filteredRows = filterTableRows(filter);
    this.totalRows = filteredRows.length;
    this.setRows(filteredRows);
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.updateCurrentPage(this.allRows);
    this.controlsStateUpdated.emit();
  }

  protected updateCurrentPage(rows: T[]): void {
    this.currentPage$.next(paginate(sort(rows, this.sorting), this.pagination));
  }
}

export function sort<T>(rows: T[], sorting: TableSort<T>): T[] {
  const sorted = rows;
  const direction = sorting.direction;
  const propertyName = sorting.propertyName;

  if (direction === null || propertyName === null) {
    return sorted;
  }
  if (sorting.sortBy) {
    return direction === SortDirection.Desc ? sortBy(sorted, sorting.sortBy).reverse() : sortBy(sorted, sorting.sortBy);
  }

  return orderBy(sorted, propertyName, direction);
}

export function paginate<T>(rows: T[], pagination: TablePagination): T[] {
  const paginated = rows;
  const pageNumber = pagination.pageNumber;
  const pageSize = pagination.pageSize;

  if (pageNumber === null || pageSize === null) {
    return paginated;
  }

  return paginated.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}
