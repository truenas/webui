import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';

export interface TableSort<T> {
  propertyName: keyof T;
  direction: SortDirection | null;
  active: number;
  sortBy?: (row: T) => string | number;
}
