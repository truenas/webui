import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-sed-status-cell',
  templateUrl: './sed-status-cell.component.html',
  styleUrls: ['./sed-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    IxIconComponent,
    TranslateModule,
  ],
})
export class SedStatusCellComponent<T extends Disk> extends ColumnComponent<T> {
  protected iconInfo = computed(() => {
    const disk = this.row();

    if (!disk.sed) {
      return { icon: 'mdi-close', class: 'unsupported', text: T('Unsupported') };
    }

    switch (disk.sed_status) {
      case SedStatus.Unlocked:
        return { icon: 'mdi-lock-open-variant', class: 'unlocked', text: T('Unlocked') };
      case SedStatus.Locked:
        return { icon: 'mdi-lock', class: 'locked', text: T('Locked') };
      case SedStatus.Uninitialized:
        return { icon: 'mdi-checkbox-blank-circle-outline', class: 'uninitialized', text: T('Uninitialized') };
      case SedStatus.Failed:
        return { icon: 'mdi-alert-circle', class: 'failed', text: T('Failed') };
      default:
        return { icon: 'mdi-help-circle', class: 'unknown', text: T('Unknown') };
    }
  });
}

export function sedStatusColumn<T extends Disk>(
  options: Partial<SedStatusCellComponent<T>>,
): Column<T, SedStatusCellComponent<T>> {
  return { type: SedStatusCellComponent, ...options };
}
