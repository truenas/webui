import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-checkbox',
  templateUrl: './ix-cell-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellCheckboxComponent<T> extends ColumnComponent<T> {
  onRowCheck: (row: T, checked: boolean) => void;

  get checked(): boolean {
    return this.value as boolean;
  }

  onCheckboxChange(event: MatCheckboxChange): void {
    this.onRowCheck(this.row, event.checked);
  }
}

export function checkboxColumn<T>(
  options: Partial<IxCellCheckboxComponent<T> | IxHeaderCellCheckboxComponent<T>>,
): Column<T, IxCellCheckboxComponent<T> | IxHeaderCellCheckboxComponent<T>> {
  return { type: IxCellCheckboxComponent, headerType: IxHeaderCellCheckboxComponent, ...options };
}
