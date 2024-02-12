import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

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
