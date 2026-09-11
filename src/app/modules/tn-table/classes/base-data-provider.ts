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
   * Backed by a signal so a consumer can derive from it — a `tn-table`
   * `[activeRow]` that has to resolve the expanded row back to the reference
   * actually rendered, say, which would otherwise be an O(n) `find()` on every
   * change-detection pass. Reads and writes stay a plain property, as every
   * existing call site (and `DataProvider`) expects.
   *
   * Because the write is now a signal write, it cannot happen inside a
   * `computed` (NG0600) — assign it from an event handler, a subscription or an
   * effect, which is where every caller already does.
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
   * Applies a filter and, by default, sends the user back to the first page — the right
   * move when the QUERY changed, since the rows they were reading are no longer the ones
   * the table holds.
   *
   * Pass `keepPage` when the same query is being re-run against refreshed rows, e.g. a
   * background reload the user did not ask for. Resetting there reads as the table losing
   * their place mid-task, which is what NAS-143108 reported. A page the refreshed total
   * puts out of range is clamped back to the last page that has rows, so the user can
   * never be stranded on an empty page whose pager the empty state has unmounted.
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
