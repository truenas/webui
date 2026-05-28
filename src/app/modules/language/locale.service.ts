import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { isValid, parse } from 'date-fns';
import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { combineLatest } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

// Cached on first read instead of at module load. Re-resolving the IANA
// timezone on every toMachineTime call is wasteful for a long-lived admin tab,
// so cache it lazily — first call pays the Intl cost, the rest are free.
// Trade-off: the rare environments that re-resolve the browser timezone at
// runtime (embedded Chromium, the Chrome DevTools "Sensors" panel) won't be
// picked up after the first read; a full reload reinitializes the cache.
let cachedBrowserTimezone: string | undefined;
function getBrowserTimezone(): string {
  if (cachedBrowserTimezone === undefined) {
    cachedBrowserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return cachedBrowserTimezone;
}

// Projects an instant onto the wall-clock of `machineTimezone`, returned as a
// Date whose browser-local components (the ones date-fns-tz `format()` reads
// when called without a timeZone option) equal that wall-clock. The
// `fromZonedTime` hop normalizes the input to an absolute UTC instant whether
// it arrived as unix-ms or as a Date already re-zoned into another timezone, so
// the conversion holds in both cases.
//
// Pure — the timezone is passed in rather than read from the service — so
// `<ix-date>` can share it driven by the mockable `LocaleService.timezone`
// property. That keeps the component testable: a unit test stubbing only
// `timezone` gets the real conversion without having to stub a service method
// (an auto-mocked method returns `undefined` and would otherwise break render).
export function getMachineTime(date: number | Date, machineTimezone: string | undefined): Date {
  const browserTimezone = getBrowserTimezone();
  const instant = fromZonedTime(date, browserTimezone);
  return toZonedTime(instant, machineTimezone ?? browserTimezone);
}

export type SupportedTimeFormat = 'hh:mm:ss aa' | "hh:mm:ss aaaaa'm'" | 'HH:mm:ss';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  t24 = T('(24 Hours)');
  timezone: string | undefined;
  dateFormat = 'yyyy-MM-dd';
  timeFormat: SupportedTimeFormat = 'HH:mm:ss';

  constructor() {
    combineLatest([
      this.store$.select(selectTimezone),
      this.store$.pipe(waitForPreferences),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([timezone, preferences]) => {
      this.timezone = timezone;

      if (preferences?.dateFormat) {
        this.dateFormat = this.formatDateTimeToDateFns(preferences.dateFormat);
      }

      if (preferences?.timeFormat) {
        this.timeFormat = this.formatDateTimeToDateFns(preferences.timeFormat) as SupportedTimeFormat;
      }
    });
  }

  getDateFormatOptions(tz?: string): Option[] {
    let date = new Date();
    if (tz) {
      date = toZonedTime(new Date().valueOf(), tz);
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
      date = toZonedTime(new Date().valueOf(), tz);
    }
    return [
      { label: `${format(date, 'HH:mm:ss')} ${this.translate.instant(this.t24)}`, value: 'HH:mm:ss' },
      { label: format(date, 'hh:mm:ss aaaaa\'m\''), value: 'hh:mm:ss aaaaa\'m\'' },
      { label: format(date, 'hh:mm:ss aa'), value: 'hh:mm:ss aa' },
    ];
  }

  getDateFromString(timestamp: string, timezone?: string): Date {
    const normalizedTimestamp = timestamp.trim();

    const dateFormats = this.getDateFormatOptions().map((option) => option.value);
    const timeFormats = this.getTimeFormatOptions().map((option) => option.value);

    const formats = [
      ...dateFormats,
      ...dateFormats.flatMap((dateFormat) => timeFormats.map((timeFormat) => `${dateFormat} ${timeFormat}`)),
    ] as string[];

    for (const dateFormat of formats) {
      const parsedDate = parse(normalizedTimestamp, dateFormat, new Date());
      if (isValid(parsedDate)) {
        if (timezone) {
          return fromZonedTime(parsedDate, timezone);
        }
        return parsedDate;
      }
    }

    throw new Error(`Invalid date format: ${timestamp}`);
  }

  getPreferredDateFormat(): string {
    return this.dateFormat;
  }

  getPreferredTimeFormat(): SupportedTimeFormat {
    return this.timeFormat;
  }

  getDateAndTime(tz?: string): [string, string] {
    let date = new Date();
    if (tz) {
      date = toZonedTime(new Date().valueOf(), tz);
    } else if (this.timezone) {
      date = toZonedTime(new Date().valueOf(), this.timezone);
    }
    return [format(date, this.dateFormat), format(date, this.timeFormat)];
  }

  // Converts an instant to the configured machine timezone's wall-clock. Thin
  // wrapper over the shared `getMachineTime` so callers holding a `LocaleService`
  // (e.g. the snapshot rollback dialog) don't have to read `timezone` themselves;
  // `<ix-date>` calls `getMachineTime` directly. See `getMachineTime` above.
  toMachineTime(date: number | Date): Date {
    return getMachineTime(date, this.timezone);
  }

  getShortTimeFormat(): string {
    switch (this.timeFormat) {
      case 'HH:mm:ss':
        return 'HH:mm';
      case 'hh:mm:ss aa':
        return 'hh:mm aa';
      case "hh:mm:ss aaaaa'm'":
        return 'hh:mm aaaaa\'m\'';
      default:
        return 'HH:mm';
    }
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
