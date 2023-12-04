import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';

export class PaginationServerSide {
  getParams(pagination: TablePagination): ApiCallParams {
    if (pagination.pageNumber === null || pagination.pageSize === null) {
      return {};
    }

    return {
      offset: (pagination.pageNumber - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    };
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void): void {
    loadRowsAndUpdatePage();
  }
}
