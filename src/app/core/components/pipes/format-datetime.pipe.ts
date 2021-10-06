import { Pipe, PipeTransform } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { format, utcToZonedTime } from 'date-fns-tz';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Pipe({
  name: 'formatDateTime',
  pure: false,
})
export class FormatDateTimePipe implements PipeTransform {
  timeZone: string;
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';

  constructor(private sysGeneralService: SystemGeneralService) {
    this.sysGeneralService.getGeneralConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.timeZone = res.timezone;
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
    if (tz) {
      date = utcToZonedTime(date.valueOf(), tz);
    } else if (this.timeZone) {
      date = utcToZonedTime(date.valueOf(), this.timeZone);
    }

    return format(date, `${this.dateFormat} ${this.timeFormat}`);
  }
}
