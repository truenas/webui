import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { format, utcToZonedTime } from 'date-fns-tz';
import { Subject, combineLatest } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Injectable()
export class LocaleService {
  t24 = T('(24 Hours)');
  timezone: string;
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';
  target: Subject<CoreEvent> = new Subject();

  constructor(
    private store$: Store<AppState>,
  ) {
    combineLatest([
      this.store$.select(selectTimezone),
      this.store$.pipe(waitForPreferences),
    ]).pipe(untilDestroyed(this)).subscribe(([timezone, preferences]) => {
      this.timezone = timezone;

      if (preferences?.dateFormat) {
        this.dateFormat = this.formatDateTimeToDateFns(preferences.dateFormat);
      }

      if (preferences?.timeFormat) {
        this.timeFormat = this.formatDateTimeToDateFns(preferences.timeFormat);
      }
    });
  }

  getDateFormatOptions(tz?: string): Option[] {
    let date = new Date();
    if (tz) {
      date = utcToZonedTime(new Date().valueOf(), tz);
    }

    return [
      { label: format(date, 'yyyy-MM-dd'), value: 'yyyy-MM-dd' },
      { label: format(date, 'MMMM d, yyyy'), value: 'MMMM d, yyyy' },
      { label: format(date, 'd MMMM, yyyy'), value: 'd MMMM, yyyy' },
      { label: format(date, 'MMM d, yyyy'), value: 'MMM d, yyyy' },
      { label: format(date, 'd MMM yyyy'), value: 'd MMM yyyy' },
      { label: format(date, 'MM/dd/yyyy'), value: 'MM/dd/yyyy' },
      { label: format(date, 'dd/MM/yyyy'), value: 'dd/MM/yyyy' },
      { label: format(date, 'dd.MM.yyyy'), value: 'dd.MM.yyyy' },
    ];
  }

  getTimeFormatOptions(tz?: string): Option[] {
    let date = new Date();
    if (tz) {
      date = utcToZonedTime(new Date().valueOf(), tz);
    }
    return [
      { label: `${format(date, 'HH:mm:ss')} ${this.t24}`, value: 'HH:mm:ss' },
      { label: format(date, 'hh:mm:ss aaaaa\'m\''), value: 'hh:mm:ss aaaaa\'m\'' },
      { label: format(date, 'hh:mm:ss aa'), value: 'hh:mm:ss aa' },
    ];
  }

  formatDateTime(date: Date | number, tz?: string): string {
    if (tz) {
      date = utcToZonedTime(date.valueOf(), tz);
    } else if (this.timezone) {
      date = utcToZonedTime(date.valueOf(), this.timezone);
    }

    return format(date, `${this.dateFormat} ${this.timeFormat}`);
  }

  formatDateTimeWithNoTz(date: Date): string {
    try {
      return format(date.valueOf(), `${this.dateFormat} ${this.timeFormat}`);
    } catch (error: unknown) {
      return 'Invalid date';
    }
  }

  getTimeOnly(date: Date | number, seconds = true, tz?: string): string {
    if (tz) {
      date = utcToZonedTime(date.valueOf(), tz);
    } else if (this.timezone) {
      date = utcToZonedTime(date.valueOf(), this.timezone);
    }
    let formatStr: string;
    formatStr = this.timeFormat;
    if (!seconds) {
      formatStr = formatStr.replace(':ss', '');
    }

    return format(date, formatStr);
  }

  getPreferredDateFormat(): string {
    return this.dateFormat;
  }

  getPreferredTimeFormat(): string {
    return this.timeFormat;
  }

  getDateAndTime(tz?: string): [string, string] {
    let date = new Date();
    if (tz) {
      date = utcToZonedTime(new Date().valueOf(), tz);
    } else if (this.timezone) {
      date = utcToZonedTime(new Date().valueOf(), this.timezone);
    }
    return [format(date, `${this.dateFormat}`), format(date, `${this.timeFormat}`)];
  }

  formatDateTimeToDateFns(format: string): string {
    let dateFnsFormat = format
      .replace('YYYY', 'yyyy')
      .replace('YY', 'y')
      .replace('DD', 'dd')
      .replace('D', 'd')
      .replace(' A', ' aa');
    if (dateFnsFormat && !dateFnsFormat.includes('aa')) {
      dateFnsFormat = dateFnsFormat.replace(' a', ' aaaaa\'m\'');
    }
    return dateFnsFormat;
  }

  getPreferredDateFormatForChart(): string {
    return this.formatDateTimeToChart(this.dateFormat);
  }

  getPreferredTimeFormatForChart(): string {
    return this.formatDateTimeToChart(this.timeFormat);
  }

  /** Revert DateFns for Chart DateTime format */
  formatDateTimeToChart(format: string): string {
    const dateFormat = format
      .replace('yyyy', 'YYYY')
      .replace('y', 'YY')
      .replace('dd', 'DD')
      .replace('d', 'D')
      .replace(' aaaaa\'m\'', ' a')
      .replace(' aa', ' A');
    return dateFormat;
  }
}
