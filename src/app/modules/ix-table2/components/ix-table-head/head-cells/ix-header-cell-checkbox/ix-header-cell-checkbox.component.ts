import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-header-cell-checkbox.component.html',
})
export class IxHeaderCellCheckboxComponent<T> extends ColumnComponent<T> {
  onCheckboxChange(value: MatCheckboxChange): void {
    this.dataProvider.rows.forEach((row) => (row[this.propertyName] = value.checked as T[keyof T]));
  }

  get allChecked(): boolean {
    return this.dataProvider.rows.every((row) => row[this.propertyName]);
  }
}
