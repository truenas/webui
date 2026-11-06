import { EventEmitter, signal } from '@angular/core';
import { orderBy, sortBy } from 'lodash-es';
import {
  BehaviorSubject, Observable, Subscription, map,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { DataProvider } from 'app/modules/tn-table/interfaces/data-provider.interface';
import { TableFilter } from 'app/modules/tn-table/interfaces/table-filter.interface';
import { TablePagination } from 'app/modules/tn-table/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/tn-table/interfaces/table-sort.interface';
import { filterTableRows } from 'app/modules/tn-table/utils';

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
  totalRows = 0;

  private readonly expandedRowValue = signal<T | null>(null);

  /**
   * Signal-backed so consumers can derive from it, e.g. a `tn-table` `[activeRow]` that would otherwise
   * run `find()` on every pass, while reads and writes stay a plain property. Being a signal write, it
   * can't be assigned inside a `computed` (NG0600).
   */
  get expandedRow(): T | null {
    return this.expandedRowValue();
  }

  set expandedRow(row: T | null) {
    this.expandedRowValue.set(row);
  }

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
   * Applies a filter and, by default, returns to the first page, since a changed query means new rows.
   * Pass `keepPage` when re-running the same query on refreshed rows, so a background reload doesn't
   * lose the user's place. A page now out of range clamps to the last page with rows.
   */
  setFilter(filter: TableFilter<T>, { keepPage = false }: { keepPage?: boolean } = {}): void {
    if (!keepPage) {
      this.resetPaginationToFirstPage();
    }
    const filteredRows = filterTableRows(filter);
    if (keepPage) {
      this.clampPaginationToLastPage(filteredRows.length);
    }
    this.setRows(filteredRows);
  }

  protected resetPaginationToFirstPage(): void {
    if (this.pagination.pageNumber !== null) {
      this.pagination.pageNumber = 1;
    }
  }

  /**
   * Pulls `pageNumber` back into range for `totalRows`. Only `keepPage` needs it — every
   * other path resets to page 1 — but it has to run before `setRows`, so the page the
   * pager syncs from `currentPage$` is the one the rows were sliced for.
   *
   * Mutates `pagination` in place rather than replacing it: the pager holds a reference to
   * this same object and compares against it to tell an external change from the echo of
   * its own push.
   */
  protected clampPaginationToLastPage(totalRows: number): void {
    const { pageNumber, pageSize } = this.pagination;
    if (pageNumber === null || pageSize === null) {
      return;
    }

    const lastPage = Math.max(1, Math.ceil(totalRows / pageSize));
    if (pageNumber > lastPage) {
      this.pagination.pageNumber = lastPage;
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
