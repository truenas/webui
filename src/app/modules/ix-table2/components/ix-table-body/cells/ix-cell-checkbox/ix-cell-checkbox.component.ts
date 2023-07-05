import { Component } from '@angular/core';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-checkbox.component.html',
})
export class IxCellCheckboxComponent<T> extends ColumnComponent<T> {
  get checked(): boolean {
    return this.row[this.propertyName] as boolean;
  }

  onCheckboxChange(): void {
    this.row[this.propertyName] = !this.row[this.propertyName] as T[keyof T];
  }
}

export function checkboxColumn<T>(options: Partial<ColumnComponent<T>>): Column<T, ColumnComponent<T>> {
  return { type: IxCellCheckboxComponent, headerType: IxHeaderCellCheckboxComponent, ...options };
}
