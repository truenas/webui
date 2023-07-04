import { Component } from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-header-cell-text.component.html',
})
export class IxHeaderCellTextComponent<T> implements ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;

  dataProvider: ArrayDataProvider<T>;
}
