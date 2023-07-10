import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';

export interface TableSort<T> {
  propertyName: keyof T;
  direction: SortDirection;
  active: number;
  sortBy?: (row: T) => string | number;
}
