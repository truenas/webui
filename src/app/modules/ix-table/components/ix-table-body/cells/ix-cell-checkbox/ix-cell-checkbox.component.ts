import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-checkbox',
  templateUrl: './ix-cell-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCheckbox,
    TranslateModule,
    TestDirective,
  ],
})
export class IxCellCheckboxComponent<T> extends ColumnComponent<T> {
  onRowCheck: (row: T, checked: boolean) => void;

  get checked(): boolean {
    return this.value as boolean;
  }

  onCheckboxChange(event: MatCheckboxChange): void {
    this.onRowCheck(this.row(), event.checked);
  }
}

export function checkboxColumn<T>(
  options: Partial<IxCellCheckboxComponent<T> | IxHeaderCellCheckboxComponent<T>>,
): Column<T, IxCellCheckboxComponent<T> | IxHeaderCellCheckboxComponent<T>> {
  return { type: IxCellCheckboxComponent, headerType: IxHeaderCellCheckboxComponent, ...options };
}
