import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  templateUrl: './ix-cell-relative-date.component.html',
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
    if (this.value) {
      return formatDistanceToNow(this.value as number, { addSuffix: true });
    } else {
      return this.translate.instant('N/A');
    }
  }

  get dateTooltip(): string {
    if (+this.value) {
      return this.formatDateTime.transform(this.value as number);
    } else {
      return this.translate.instant('N/A');
    }
  }
}

export function relativeDateColumn<T>(
  options: Partial<IxCellRelativeDateComponent<T>>,
): Column<T, IxCellRelativeDateComponent<T>> {
  return { type: IxCellRelativeDateComponent, ...options };
}
