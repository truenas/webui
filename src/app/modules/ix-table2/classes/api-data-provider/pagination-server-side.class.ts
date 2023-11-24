import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { PaginationStrategy, TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';

export class PaginationServerSide implements PaginationStrategy {
  getParams(pagination: TablePagination): ApiCallParams {
    if (pagination.pageNumber === null || pagination.pageSize === null) {
      return {};
    }

    return {
      offset: (pagination.pageNumber - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    };
  }

  paginate<T>(rows: T[]): T[] {
    return rows;
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void): void {
    loadRowsAndUpdatePage();
  }
}
