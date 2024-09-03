import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-cell-text',
  templateUrl: './ix-cell-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellTextComponent<T> extends ColumnComponent<T> {}

export function textColumn<T>(options: Partial<IxCellTextComponent<T>>): Column<T, IxCellTextComponent<T>> {
  return { type: IxCellTextComponent, ...options };
}
