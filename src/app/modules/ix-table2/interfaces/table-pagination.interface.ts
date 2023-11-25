import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';

export interface TablePagination {
  pageNumber: number;
  pageSize: number;
}

export interface PaginationStrategy {
  getParams(pagination: TablePagination): ApiCallParams;

  paginate<T>(rows: T[], pagination: TablePagination): T[];

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void;
}
