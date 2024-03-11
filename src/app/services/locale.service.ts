import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format, utcToZonedTime } from 'date-fns-tz';
import { combineLatest } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class LocaleService {
  t24 = T('(24 Hours)');
  timezone: string;
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';

  constructor(
    private store$: Store<AppState>,
    private translate: TranslateService,
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
      { label: `${format(date, 'HH:mm:ss')} ${this.translate.instant(this.t24)}`, value: 'HH:mm:ss' },
      { label: format(date, 'hh:mm:ss aaaaa\'m\''), value: 'hh:mm:ss aaaaa\'m\'' },
      { label: format(date, 'hh:mm:ss aa'), value: 'hh:mm:ss aa' },
    ];
  }

  formatDateTimeWithNoTz(date: Date): string {
    try {
      return format(date.valueOf(), `${this.dateFormat} ${this.timeFormat}`);
    } catch {
      return 'Invalid date';
    }
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
    return [format(date, this.dateFormat), format(date, this.timeFormat)];
  }

  formatDateTimeToDateFns(dateTimeFormat: string): string {
    let dateFnsFormat = dateTimeFormat
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
}
