import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableProvider } from 'app/modules/ix-table2/interfaces/table-provider.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';

export class ArrayDataProvider<T> implements TableProvider<T> {
  currentPage$ = new BehaviorSubject<T[]>([]);
  rows: T[] = [];
  expandedRow: T;

  sorting: TableSort<T> = {
    propertyName: null,
    direction: null,
    active: null,
  };

  pagination: TablePagination = {
    pageNumber: null,
    pageSize: null,
  };

  setRows(rows: T[]): void {
    this.rows = rows;
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
    this.currentPage$.next(this.paginate(this.sort(this.rows)));
  }

  private sort(rows: T[]): T[] {
    const sorted = rows;
    const direction = this.sorting.direction;
    const propertyName = this.sorting.propertyName;
    const sortBy = this.sorting.sortBy;

    if (direction === null || propertyName === null) {
      return sorted;
    }
    if (sortBy) {
      return direction === SortDirection.Desc ? _.sortBy(sorted, sortBy).reverse() : _.sortBy(sorted, sortBy);
    }

    return _.orderBy(sorted, propertyName, direction);
  }

  private paginate(rows: T[]): T[] {
    const paginated = rows;
    const pageNumber = this.pagination.pageNumber;
    const pageSize = this.pagination.pageSize;

    if (pageNumber === null || pageSize === null) {
      return paginated;
    }

    return paginated.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  }
}
