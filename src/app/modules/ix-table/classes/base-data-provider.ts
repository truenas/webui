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
  readonly sortingOrPaginationUpdate = new EventEmitter<void>();

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
  expandedRow: T | null;
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

  /**
   * Sets the sorting configuration for the data provider.
   * @param sorting - The sorting configuration to apply
   * @param skipLoad - When true, prevents triggering a data reload. Useful during component
   *                   initialization to set multiple parameters before the first load.
   */
  setSorting(sorting: TableSort<T>, skipLoad = false): void {
    this.sorting = sorting;
    this.resetPaginationToFirstPage();
    if (!skipLoad) {
      this.updateCurrentPage(this.allRows);
    }
    this.sortingOrPaginationUpdate.emit();
  }

  /**
   * Applies a filter and, by default, sends the user back to the first page — the right
   * move when the QUERY changed, since the rows they were reading are no longer the ones
   * the table holds.
   *
   * Pass `keepPage` when the same query is being re-run against refreshed rows, e.g. a
   * background reload the user did not ask for. Resetting there reads as the table losing
   * their place mid-task, which is what NAS-143108 reported.
   */
  setFilter(filter: TableFilter<T>, { keepPage = false }: { keepPage?: boolean } = {}): void {
    if (!keepPage) {
      this.resetPaginationToFirstPage();
    }
    const filteredRows = filterTableRows(filter);
    this.setRows(filteredRows);
  }

  /**
   * Re-emits the current page so the table re-renders, leaving the filter, the sort and
   * the pagination alone.
   *
   * A checkbox column keeps its state ON the row (`row.selected`) and mutates it in
   * place, so nothing in the table's OnPush tree learns about it. Re-running the filter
   * does force the re-render, but `setFilter` also resets to the first page — which is
   * why ticking a checkbox on page 2 used to snap the user back to page 1 (NAS-143108).
   */
  refreshCurrentPage(): void {
    this.currentPage$.next([]);
    this.updateCurrentPage(this.allRows);
  }

  protected resetPaginationToFirstPage(): void {
    if (this.pagination.pageNumber !== null) {
      this.pagination.pageNumber = 1;
    }
  }

  /**
   * Sets the pagination configuration for the data provider.
   * @param pagination - The pagination configuration to apply
   * @param skipLoad - When true, prevents triggering a data reload. Useful during component
   *                   initialization to set multiple parameters before the first load.
   */
  setPagination(pagination: TablePagination, skipLoad = false): void {
    this.pagination = pagination;
    if (!skipLoad) {
      this.updateCurrentPage(this.allRows);
    }
    this.sortingOrPaginationUpdate.emit();
  }

  protected updateCurrentPage(rows: T[]): void {
    const paginatorRows = paginate(sort(rows, this.sorting), this.pagination);
    this.currentPage$.next(paginatorRows);
  }
}

export function sort<T>(rows: T[], sorting: TableSort<T>): T[] {
  const sorted = rows;
  const direction = sorting.direction;
  const propertyName = sorting.propertyName;

  if (direction === null) {
    return sorted;
  }

  if (sorting.sortBy) {
    return direction === SortDirection.Desc ? sortBy(sorted, sorting.sortBy).reverse() : sortBy(sorted, sorting.sortBy);
  }

  if (propertyName === null) {
    return sorted;
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
