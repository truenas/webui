export interface TableSort<T> {
  propertyName: keyof T;
  direction: 'asc' | 'desc';
  active: number;
  sortBy?: (row: T) => string | number;
}
