import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-cell-yesno',
  templateUrl: './ix-cell-yes-no.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellYesNoComponent<T> extends ColumnComponent<T> {}

export function yesNoColumn<T>(options: Partial<IxCellYesNoComponent<T>>): Column<T, IxCellYesNoComponent<T>> {
  return { type: IxCellYesNoComponent, ...options };
}
