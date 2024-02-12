import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';

export class SortingServerSide {
  getParams<T>(sorting: TableSort<T>): ApiCallParams {
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
