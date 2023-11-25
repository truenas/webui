import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { paginate } from 'app/modules/ix-table2/classes/base-data-provider';
import { PaginationStrategy, TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';

export class PaginationClientSide implements PaginationStrategy {
  getParams(): ApiCallParams {
    return {};
  }

  paginate<T>(rows: T[], pagination: TablePagination): T[] {
    return paginate(rows, pagination);
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void {
    updatePage();
  }
}
