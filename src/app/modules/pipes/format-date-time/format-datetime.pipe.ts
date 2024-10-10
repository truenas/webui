import {
  ChangeDetectorRef, Inject, Pipe, PipeTransform,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns-tz';
import { distinctUntilChanged } from 'rxjs';
import { invalidDate } from 'app/constants/invalid-date';
import { WINDOW } from 'app/helpers/window.helper';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';

@UntilDestroy()
@Pipe({
  name: 'formatDateTime',
  pure: false,
  standalone: true,
})
export class FormatDateTimePipe implements PipeTransform {
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';

  constructor(
    private actions$: Actions,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.checkFormatsFromLocalStorage();
    this.actions$
      .pipe(
        ofType(localizationFormSubmitted),
        distinctUntilChanged(),
        untilDestroyed(this),
      ).subscribe(() => {
        this.checkFormatsFromLocalStorage();
      });
  }

  private checkFormatsFromLocalStorage(): void {
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

  transform(value: Date | number | string, dateFormat?: string, timeFormat?: string): string {
    if (dateFormat) {
      this.dateFormat = dateFormat;
    }
    if (timeFormat) {
      this.timeFormat = timeFormat;
    }
    if (typeof value === 'string') {
      return this.formatDateTime(Date.parse(value));
    }

    return this.formatDateTime(value);
  }

  private formatDateTime(date: Date | number): string {
    try {
      const localDate = date;

      // Reason for below replacements: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
      if (this.dateFormat) {
        this.dateFormat = this.dateFormat
          .replace('YYYY', 'yyyy')
          .replace('YY', 'y')
          .replace('DD', 'dd')
          .replace('D', 'd')
          .replace(' A', ' aa');
      }
      if (this.timeFormat) {
        this.timeFormat = this.timeFormat.replace(' A', ' aa');
      }
      if (this.dateFormat === ' ') {
        return format(localDate, this.timeFormat);
      }
      return format(localDate, `${this.dateFormat} ${this.timeFormat}`);
    } catch {
      return this.translate.instant(invalidDate);
    }
  }
}
