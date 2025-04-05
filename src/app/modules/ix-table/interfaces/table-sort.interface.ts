import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';

export interface TableSort<T> {
  propertyName: keyof T | null;
  direction: SortDirection | null;
  active: number | null;
  sortBy?: (row: T) => string | number;
}
