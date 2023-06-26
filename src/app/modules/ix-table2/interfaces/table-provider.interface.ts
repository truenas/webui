import { Observable } from 'rxjs';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';

export interface TableProvider<T> {
  rows: T[];
  currentPage$: Observable<T[]>;
  expandedRow: T;
  setSorting: (sorting: TableSort<T>) => void;
  sorting: TableSort<T>;
  setPagination: (pagination: TablePagination) => void;
  pagination: TablePagination;
}
