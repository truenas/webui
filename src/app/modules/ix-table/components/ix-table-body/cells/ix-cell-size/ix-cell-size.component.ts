import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-cell-size',
  templateUrl: './ix-cell-size.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TestIdModule, FileSizePipe],
})
export class IxCellSizeComponent<T> extends ColumnComponent<T> {
  get size(): number {
    return this.value as number;
  }
}

export function sizeColumn<T>(options: Partial<IxCellSizeComponent<T>>): Column<T, IxCellSizeComponent<T>> {
  return { type: IxCellSizeComponent, ...options };
}
