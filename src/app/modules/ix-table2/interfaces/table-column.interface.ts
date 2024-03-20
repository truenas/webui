import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';

export abstract class ColumnComponent<T> {
  propertyName: keyof T;
  title: string;
  cssClass?: string;
  rowTestId: (row: T) => string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  getValue?: (row: T) => unknown;
  hidden = false;

  protected get value(): unknown {
    return this.getValue ? this.getValue(this.row) : this.row[this.propertyName];
  }

  protected row: T;
  getRow(): T {
    return this.row;
  }
  setRow(row: T): void {
    this.row = row;
  }
  dataProvider?: DataProvider<T>;
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new () => C;
  headerType?: new () => C;
} & Partial<C>;
