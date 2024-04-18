import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';

export class PaginationServerSide {
  getParams(pagination: TablePagination, totalRows: number): Record<string, unknown> {
    if (pagination.pageNumber === null || pagination.pageSize === null) {
      return {};
    }

    const offset = (pagination.pageNumber - 1) * pagination.pageSize;

    return {
      offset: offset >= totalRows ? 0 : offset,
      limit: pagination.pageSize,
    };
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void): void {
    loadRowsAndUpdatePage();
  }
}
