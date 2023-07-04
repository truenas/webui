import { Component } from '@angular/core';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-text.component.html',
})
export class IxCellTextComponent<T> implements ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  row: T;

  get value(): T[keyof T] {
    return this.row[this.propertyName];
  }
}
