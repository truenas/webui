import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export abstract class ColumnComponent<T> {
  identifier?: boolean;
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  hidden = false;

  protected row: T;
  getRow(): T {
    return this.row;
  }
  setRow(row: T): void {
    this.row = row;
  }
  dataProvider?: ArrayDataProvider<T>;
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new () => C;
  headerType?: new () => C;
} & Partial<C>;
