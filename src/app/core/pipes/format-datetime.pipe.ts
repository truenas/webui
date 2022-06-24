import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { format, utcToZonedTime } from 'date-fns-tz';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Pipe({
  name: 'formatDateTime',
  pure: false,
})
export class FormatDateTimePipe implements PipeTransform {
  timezone: string;
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';

  constructor(
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
  ) {
    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
      this.cdr.markForCheck();
    });
    if (window.localStorage.dateFormat) {
      this.dateFormat = window.localStorage.getItem('dateFormat');
    }
    if (window.localStorage.timeFormat) {
      this.timeFormat = window.localStorage.getItem('timeFormat');
    }
  }

  transform(value: Date | number, timezone?: string, dateFormat?: string, timeFormat?: string): string {
    if (dateFormat) {
      this.dateFormat = dateFormat;
    }
    if (timeFormat) {
      this.timeFormat = timeFormat;
    }

    return this.formatDateTime(value, timezone);
  }

  formatDateTime(date: Date | number, tz?: string): string {
    let localDate = date;
    if (tz !== null) {
      if (tz) {
        localDate = utcToZonedTime(date.valueOf(), tz);
      } else if (this.timezone) {
        localDate = utcToZonedTime(date.valueOf(), this.timezone);
      }
    }

    // Reason for below replacements: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
    this.dateFormat = this.dateFormat
      .replace('YYYY', 'yyyy')
      .replace('YY', 'y')
      .replace('DD', 'dd')
      .replace('D', 'd')
      .replace(' A', ' aa');
    return format(localDate, `${this.dateFormat} ${this.timeFormat}`);
  }
}
