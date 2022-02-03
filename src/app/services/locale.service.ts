import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { format, utcToZonedTime } from 'date-fns-tz';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { UserPreferencesReadyEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { Option } from 'app/interfaces/option.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { PreferencesService } from 'app/services/preferences.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { SystemGeneralService } from '.';

@UntilDestroy()
@Injectable()
export class LocaleService {
  t24 = T('(24 Hours)');
  timeZone: string;
  isWaiting = false;
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';
  dateTimeFormatChange$ = new Subject();
  target: Subject<CoreEvent> = new Subject();

  constructor(
    public prefService: PreferencesService,
    public sysGeneralService: SystemGeneralService,
    private core: CoreService,
    private store$: Store<AppState>,
  ) {
    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timeZone = timezone;
    });
    if (window.localStorage.dateFormat) {
      this.dateFormat = this.formatDateTimeToDateFns(window.localStorage.getItem('dateFormat'));
    }
    if (window.localStorage.timeFormat) {
      this.timeFormat = this.formatDateTimeToDateFns(window.localStorage.getItem('timeFormat'));
    }
    this.getPrefs();
  }

  getPrefs(): void {
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });
    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' })
      .pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesReadyEvent) => {
        if (this.isWaiting) {
          this.target.next({ name: 'SubmitComplete', sender: this });
          this.isWaiting = false;
        }
        this.dateFormat = this.formatDateTimeToDateFns(evt.data.dateFormat);
        this.timeFormat = this.formatDateTimeToDateFns(evt.data.timeFormat);
        this.storeDateTimeFormat(this.dateFormat, this.timeFormat);
        this.dateTimeFormatChange$.next();
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
    } else if (this.timeZone) {
      date = utcToZonedTime(date.valueOf(), this.timeZone);
    }

    return format(date, `${this.dateFormat} ${this.timeFormat}`);
  }

  formatDateTimeWithNoTz(date: Date): string {
    try {
      return format(date.valueOf(), `${this.dateFormat} ${this.timeFormat}`);
    } catch (e: unknown) {
      return 'Invalid date';
    }
  }

  getTimeOnly(date: Date | number, seconds = true, tz?: string): string {
    if (tz) {
      date = utcToZonedTime(date.valueOf(), tz);
    } else if (this.timeZone) {
      date = utcToZonedTime(date.valueOf(), this.timeZone);
    }
    let formatStr: string;
    formatStr = this.timeFormat;
    if (!seconds) {
      formatStr = formatStr.replace(':ss', '');
    }

    return format(date, formatStr);
  }

  saveDateTimeFormat(dateFormat: string, timeFormat: string): void {
    this.dateFormat = this.formatDateTimeToDateFns(dateFormat);
    this.timeFormat = this.formatDateTimeToDateFns(timeFormat);
    this.storeDateTimeFormat(this.dateFormat, this.timeFormat);
    this.dateTimeFormatChange$.next();

    this.core.emit({
      name: 'ChangePreference',
      data: {
        key: 'dateFormat', value: dateFormat,
      },
      sender: this,
    });
    this.core.emit({
      name: 'ChangePreference',
      data: {
        key: 'timeFormat', value: timeFormat,
      },
      sender: this,
    });
  }

  storeDateTimeFormat(dateFormat: string, timeFormat: string): void {
    window.localStorage.setItem('dateFormat', dateFormat);
    window.localStorage.setItem('timeFormat', timeFormat);
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
    } else if (this.timeZone) {
      date = utcToZonedTime(new Date().valueOf(), this.timeZone);
    }
    return [format(date, `${this.dateFormat}`), format(date, `${this.timeFormat}`)];
  }

  getCopyrightYearFromBuildTime(): string {
    const buildTime = localStorage.getItem('buildtime')?.trim();
    if (!buildTime) {
      return '';
    }

    const buildTimeInMillis = parseInt(buildTime);
    return new Date(buildTimeInMillis).getFullYear().toString();
  }

  formatDateTimeToDateFns(format: string): string {
    let dateFnsFormat = format
      .replace('YYYY', 'yyyy')
      .replace('YY', 'y')
      .replace('DD', 'dd')
      .replace('D', 'd')
      .replace(' A', ' aa');
    if (!dateFnsFormat.includes('aa')) {
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
