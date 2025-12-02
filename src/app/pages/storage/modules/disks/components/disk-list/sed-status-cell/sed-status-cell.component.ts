import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-sed-status-cell',
  templateUrl: './sed-status-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
  ],
})
export class SedStatusCellComponent<T extends Disk> extends ColumnComponent<T> {
  protected statusText = computed(() => {
    const disk = this.row();

    if (!disk.sed) {
      return T('Unsupported');
    }

    switch (disk.sed_status) {
      case SedStatus.Unlocked:
        return T('Unlocked');
      case SedStatus.Locked:
        return T('Locked');
      case SedStatus.Uninitialized:
        return T('Uninitialized');
      case SedStatus.Failed:
        return T('Failed');
      default:
        return T('Unknown');
    }
  });
}

export function sedStatusColumn<T extends Disk>(
  options: Partial<SedStatusCellComponent<T>>,
): Column<T, SedStatusCellComponent<T>> {
  return { type: SedStatusCellComponent, ...options };
}
