import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-size',
  templateUrl: './ix-cell-size.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileSizePipe, TranslateModule, TestDirective],
})
export class IxCellSizeComponent<T> extends ColumnComponent<T> {
  get size(): number | null | undefined {
    return this.value as number | null | undefined;
  }
}

export function sizeColumn<T>(options: Partial<IxCellSizeComponent<T>>): Column<T, IxCellSizeComponent<T>> {
  return { type: IxCellSizeComponent, ...options };
}
