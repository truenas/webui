import { Component } from '@angular/core';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-body-cell-base.component.html',
})
export class IxBodyCellBaseComponent<T> {
  row: T;
  column: TableColumn<T>;

  get value(): T[keyof T] {
    return this.row[this.column.propertyName];
  }
}
