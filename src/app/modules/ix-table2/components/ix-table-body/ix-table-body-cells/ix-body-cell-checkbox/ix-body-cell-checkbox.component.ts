import { Component } from '@angular/core';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';

@Component({
  templateUrl: './ix-body-cell-checkbox.component.html',
})
export class IxBodyCellCheckboxComponent<T> extends IxBodyCellBaseComponent<T> {
  get checked(): boolean {
    return this.value as boolean;
  }

  onCheckboxChange(): void {
    this.row[this.column.propertyName] = !this.row[this.column.propertyName] as T[keyof T];
  }
}
