import { Component } from '@angular/core';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-checkbox.component.html',
})
export class IxCellCheckboxComponent<T> implements ColumnComponent<T> {
  propertyName: keyof T;
  title?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  row: T;

  get checked(): boolean {
    return this.row[this.propertyName] as boolean;
  }

  onCheckboxChange(): void {
    this.row[this.propertyName] = !this.row[this.propertyName] as T[keyof T];
  }
}
