import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isValid } from 'date-fns';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-cell-relative-date',
  templateUrl: './ix-cell-relative-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellRelativeDateComponent<T> extends ColumnComponent<T> {
  translate: TranslateService;
  formatDateTime: FormatDateTimePipe;

  constructor() {
    super();
    this.translate = inject(TranslateService);
    this.formatDateTime = inject(FormatDateTimePipe);
  }

  get date(): string {
    if (!this.value) {
      return this.translate.instant('N/A');
    }

    if (isValid(new Date(this.value as string))) {
      return formatDistanceToNowShortened(this.value as number);
    }

    return this.value as string;
  }

  get dateTooltip(): string {
    if (!this.value) {
      return this.translate.instant('N/A');
    }

    if (isValid(new Date(this.value as string))) {
      return this.formatDateTime.transform(this.value as number);
    }

    return this.value as string;
  }
}

export function relativeDateColumn<T>(
  options: Partial<IxCellRelativeDateComponent<T>>,
): Column<T, IxCellRelativeDateComponent<T>> {
  return { type: IxCellRelativeDateComponent, ...options };
}
