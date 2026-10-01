import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Disk } from 'app/interfaces/disk.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status-label.utils';

@Component({
  selector: 'ix-sed-status-cell',
  templateUrl: './sed-status-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
  ],
})
export class SedStatusCellComponent<T extends Disk> extends ColumnComponent<T> {
  protected statusText = computed(() => sedStatusLabel(this.row()));
}

export function sedStatusColumn<T extends Disk>(
  options: Partial<SedStatusCellComponent<T>>,
): Column<T, SedStatusCellComponent<T>> {
  return { type: SedStatusCellComponent, ...options };
}
