import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';
import { isValid } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { invalidDate } from 'app/constants/invalid-date';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { LocaleService } from 'app/modules/language/locale.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-relative-date',
  templateUrl: './ix-cell-relative-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltip, TestDirective],
  providers: [FormatDateTimePipe],
})
export class IxCellRelativeDateComponent<T> extends ColumnComponent<T> {
  translate: TranslateService;
  localeService: LocaleService;
  formatDateTime: FormatDateTimePipe;
  defaultTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  machineTimezone: string;

  constructor() {
    super();
    this.translate = inject(TranslateService);
    this.formatDateTime = inject(FormatDateTimePipe);
    this.localeService = inject(LocaleService);

    if (this.localeService.timezone) {
      this.machineTimezone = this.localeService.timezone;
    }
  }

  get machineTime(): Date {
    const utc = zonedTimeToUtc(this.value as number, this.defaultTz);
    return utcToZonedTime(utc, this.machineTimezone);
  }

  get isTimezoneDifference(): boolean {
    return this.machineTime < (this.value as Date) || this.machineTime > (this.value as Date);
  }

  get isInvalidDate(): boolean {
    return this.translate.instant(this.date) === this.translate.instant(invalidDate);
  }

  get date(): string {
    if (!this.value) {
      return this.translate.instant('N/A');
    }

    if (isValid(this.value)) {
      return formatDistanceToNowShortened(this.value as number);
    }

    return this.value as string;
  }

  get dateTooltip(): string {
    if (!this.value) {
      return this.translate.instant('N/A');
    }

    if (isValid(this.value)) {
      if (!this.isTimezoneDifference) {
        return this.formatDateTime.transform(this.machineTime);
      }

      const browserTime = this.formatDateTime.transform(this.value as number);
      const machineTime = this.formatDateTime.transform(this.machineTime);

      return this.translate.instant('Machine Time: {machineTime} \n Browser Time: {browserTime}', {
        machineTime,
        browserTime,
      });
    }

    return this.value as string;
  }
}

export function relativeDateColumn<T>(
  options: Partial<IxCellRelativeDateComponent<T>>,
): Column<T, IxCellRelativeDateComponent<T>> {
  return { type: IxCellRelativeDateComponent, ...options };
}
