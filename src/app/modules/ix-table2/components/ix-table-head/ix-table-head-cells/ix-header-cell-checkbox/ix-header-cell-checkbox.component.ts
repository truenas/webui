import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { IxHeaderCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head-cells/ix-header-cell-base/ix-header-cell-base.component';

@Component({
  templateUrl: './ix-header-cell-checkbox.component.html',
})
export class IxHeaderCellCheckboxComponent<T> extends IxHeaderCellBaseComponent<T> {
  onCheckboxChange(value: MatCheckboxChange): void {
    this.dataProvider.rows.forEach((row) => (row[this.column.propertyName] = value.checked as T[keyof T]));
  }

  get allChecked(): boolean {
    return this.dataProvider.rows.every((row) => row[this.column.propertyName]);
  }
}
