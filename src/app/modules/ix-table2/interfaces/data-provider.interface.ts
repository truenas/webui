import { Observable } from 'rxjs';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';

export interface DataProvider<T> {
  totalRows: number;
  currentPage$: Observable<T[]>;
  currentPageCount$: Observable<number>;
  expandedRow: T;
  sorting: TableSort<T>;
  pagination: TablePagination;

  setPagination: (pagination: TablePagination) => void;
  setSorting: (sorting: TableSort<T>) => void;
  setRows: (rows: T[]) => void;
}
