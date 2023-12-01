import { paginate } from 'app/modules/ix-table2/classes/base-data-provider';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';

export class PaginationClientSide {
  paginate<T>(rows: T[], pagination: TablePagination): T[] {
    return paginate(rows, pagination);
  }

  handleCurrentPage(updatePage: () => void): void {
    updatePage();
  }
}
