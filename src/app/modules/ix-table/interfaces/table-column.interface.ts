import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

export abstract class ColumnComponent<T> {
  propertyName: keyof T;
  title: string;
  cssClass?: string;
  rowTestId: (row: T) => string;
  ariaLabels: (row: T) => string[];
  sortBy?: (row: T) => string | number;
  disableSorting?: boolean;
  getValue?: (row: T) => unknown;
  hidden = false;

  protected get value(): unknown {
    return this.getValue ? this.getValue(this.row) : this.row[this.propertyName];
  }

  row: T;

  getRow(): T {
    return this.row;
  }
  setRow(row: T): void {
    this.row = row;
  }
  getAriaLabel(row: T): string {
    return this.ariaLabels(row)?.join(' ') || this.title;
  }
  dataProvider?: DataProvider<T>;
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new () => C;
  headerType?: new () => C;
} & Partial<C>;
