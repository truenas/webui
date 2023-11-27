import { ApiCallParams } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';

export interface TableSort<T> {
  propertyName: keyof T;
  direction: SortDirection;
  active: number;
  sortBy?: (row: T) => string | number;
}

export interface SortingStrategy {
  getParams<T>(sorting: TableSort<T>): ApiCallParams;

  sort<T>(rows: T[], sorting: TableSort<T>): T[];

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void;
}
