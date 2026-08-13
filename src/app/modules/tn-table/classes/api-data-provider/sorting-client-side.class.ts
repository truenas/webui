import { sort } from 'app/modules/tn-table/classes/base-data-provider';
import { TableSort } from 'app/modules/tn-table/interfaces/table-sort.interface';

export class SortingClientSide {
  sort<T>(rows: T[], sorting: TableSort<T>): T[] {
    return sort(rows, sorting);
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void {
    updatePage();
  }
}
