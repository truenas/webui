import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-yesno',
  templateUrl: './ix-cell-yesno.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellYesNoComponent<T> extends ColumnComponent<T> {}

export function yesNoColumn<T>(options: Partial<IxCellYesNoComponent<T>>): Column<T, IxCellYesNoComponent<T>> {
  return { type: IxCellYesNoComponent, ...options };
}
