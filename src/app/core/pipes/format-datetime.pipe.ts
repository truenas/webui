import {
  ChangeDetectorRef, Inject, Pipe, PipeTransform,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { format, utcToZonedTime } from 'date-fns-tz';
import { distinctUntilChanged } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { AppState } from 'app/store';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';
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
    private actions$: Actions,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {
    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
      this.cdr.markForCheck();
      this.checkFormatsFromLocalStorage();
    });

    this.actions$
      .pipe(
        ofType(localizationFormSubmitted),
        distinctUntilChanged(),
        untilDestroyed(this),
      ).subscribe(() => {
        this.checkFormatsFromLocalStorage();
      });
  }

  checkFormatsFromLocalStorage(): void {
    ['dateFormat', 'timeFormat'].forEach((value) => {
      if (this.window.localStorage[value]) {
        const storedFormat = this.window.localStorage.getItem(value);
        try {
          if (format(new Date(), storedFormat)) {
            if (value === 'dateFormat') {
              this.dateFormat = storedFormat;
            } else {
              this.timeFormat = storedFormat;
            }
          }
          this.cdr.markForCheck();
        } catch {
          this.window.localStorage.removeItem(value);
        }
      }
    });
  }

  transform(value: Date | number | string, timezone?: string, dateFormat?: string, timeFormat?: string): string {
    if (dateFormat) {
      this.dateFormat = dateFormat;
    }
    if (timeFormat) {
      this.timeFormat = timeFormat;
    }
    if (typeof value === 'string') {
      return this.formatDateTime(Date.parse(value), timezone);
    }

    return this.formatDateTime(value, timezone);
  }

  formatDateTime(date: Date | number, tz?: string): string {
    try {
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
      if (this.timeFormat) {
        this.timeFormat = this.timeFormat.replace(' A', ' aa');
      }
      return format(localDate, `${this.dateFormat} ${this.timeFormat}`);
    } catch {
      return 'Invalid date';
    }
  }
}
