import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

export interface ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;

  row?: T;
  dataProvider?: ArrayDataProvider<T>;
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new (formatter?: IxFormatterService) => C;
  headerType?: new () => C;
} & Partial<C>;
