import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-cell-size',
  templateUrl: './ix-cell-size.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellSizeComponent<T> extends ColumnComponent<T> {
  get size(): number {
    return this.value as number;
  }
}

export function sizeColumn<T>(options: Partial<IxCellSizeComponent<T>>): Column<T, IxCellSizeComponent<T>> {
  return { type: IxCellSizeComponent, ...options };
}
