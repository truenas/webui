export interface TableColumn<T> {
  title?: string;
  propertyName: keyof T;
  sortBy?: (row: T) => string | number;
}
