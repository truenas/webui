import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';

/**
 * What a sort accessor may hand to lodash `sortBy` — anything it orders sensibly. Wider than a
 * bare `string | number` because an accessor may return a boolean, or nothing at all for a row
 * that has no value to sort by (lodash sorts those last).
 */
export type SortValue = string | number | boolean | null | undefined;

export interface TableSort<T> {
  propertyName: keyof T | null;
  direction: SortDirection | null;
  active: number | null;
  sortBy?: (row: T) => SortValue;
}
