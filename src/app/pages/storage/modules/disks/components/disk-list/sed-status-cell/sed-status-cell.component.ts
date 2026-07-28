import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

/**
 * Untranslated SED status label for a disk. Shared so the tn-table cell template and this
 * ix-table cell component (still used for the hidden-column readout in the details row)
 * can never drift apart.
 */
export function sedStatusLabel(disk: Disk): string {
  if (!disk?.sed) {
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
}

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
