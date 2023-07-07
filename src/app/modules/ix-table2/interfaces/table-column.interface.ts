import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export abstract class ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;

  row?: T;
  dataProvider?: ArrayDataProvider<T>;
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new () => C;
  headerType?: new () => C;
} & Partial<C>;
