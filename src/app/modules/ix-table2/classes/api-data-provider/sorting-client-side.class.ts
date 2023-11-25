import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { sort } from 'app/modules/ix-table2/classes/base-data-provider';
import { SortingStrategy, TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';

export class SortingClientSide implements SortingStrategy {
  getParams(): ApiCallParams {
    return {};
  }

  sort<T>(rows: T[], sorting: TableSort<T>): T[] {
    return sort(rows, sorting);
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void {
    updatePage();
  }
}
