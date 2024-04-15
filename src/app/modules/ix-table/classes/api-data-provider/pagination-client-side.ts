import { paginate } from 'app/modules/ix-table/classes/base-data-provider';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';

export class PaginationClientSide {
  paginate<T>(rows: T[], pagination: TablePagination): T[] {
    return paginate(rows, pagination);
  }

  handleCurrentPage(updatePage: () => void): void {
    updatePage();
  }
}
