import { signal, WritableSignal } from '@angular/core';
import { MutableKeys } from 'utility-types';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

export abstract class ColumnComponent<T> {
  propertyName?: keyof T;
  title?: string;
  headerTooltip?: string;
  cssClass?: string;
  uniqueRowTag: (row: T) => string;
  ariaLabels: (row: T) => string[];
  sortBy?: (row: T) => string | number;
  disableSorting?: boolean;
  dataProvider?: DataProvider<T>;
  getValue?: (row: T) => unknown;
  hidden = false;

  get value(): unknown {
    if (this.getValue) {
      return this.getValue(this.row());
    }
    return this.propertyName ? this.row()[this.propertyName] : '';
  }

  protected row: WritableSignal<T> = signal(null as T);

  setRow = (row: T): void => {
    this.row.set(row);
  };

  getAriaLabel = (row: T): string => {
    return this.ariaLabels(row)?.join(' ') || (this.title ? this.title : '');
  };
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new () => C;
  headerType?: new () => C;
} & Partial<C>;

export type ColumnKeys<T> = MutableKeys<ColumnComponent<T>>;
