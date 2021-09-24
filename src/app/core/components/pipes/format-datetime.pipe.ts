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
  }

  transform(value: Date | number, args?: string): string {
    return this.formatDateTime(value, args);
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
