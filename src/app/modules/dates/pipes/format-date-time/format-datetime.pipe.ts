import {
  ChangeDetectorRef, Inject, Pipe, PipeTransform,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { distinctUntilChanged } from 'rxjs';
import { invalidDate } from 'app/constants/invalid-date';
import { WINDOW } from 'app/helpers/window.helper';
import { LocaleService } from 'app/modules/language/locale.service';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';

@UntilDestroy()
@Pipe({
  name: 'formatDateTime',
  pure: false,
})
export class FormatDateTimePipe implements PipeTransform {
  dateFormat = 'yyyy-MM-dd';
  timeFormat = 'HH:mm:ss';

  constructor(
    private actions$: Actions,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private localeService: LocaleService,
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
      const storedFormat = this.window.localStorage.getItem(value);
      if (storedFormat) {
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

      const normalizedDateFormat = this.localeService.formatDateTimeToDateFns(this.dateFormat);
      const normalizedTimeFormat = this.localeService.formatDateTimeToDateFns(this.timeFormat);

      if (normalizedDateFormat === ' ') {
        return format(localDate, normalizedTimeFormat);
      }
      return format(localDate, `${normalizedDateFormat} ${normalizedTimeFormat}`);
    } catch {
      return this.translate.instant(invalidDate);
    }
  }
}
