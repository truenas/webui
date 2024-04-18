import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';

export class SortingServerSide {
  getParams<T>(sorting: TableSort<T>): Record<string, unknown> {
    if (sorting.propertyName === null || sorting.direction === null) {
      return {};
    }

    return {
      order_by: [(sorting.direction === SortDirection.Desc ? '-' : '') + (sorting.propertyName as string)],
    };
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void): void {
    loadRowsAndUpdatePage();
  }
}
