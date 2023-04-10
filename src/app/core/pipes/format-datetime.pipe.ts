import {
  ChangeDetectorRef, Inject, Pipe, PipeTransform,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WINDOW } from 'app/helpers/window.helper';
import { LocaleService } from 'app/services/locale.service';
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
    private localeService: LocaleService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
      this.cdr.markForCheck();
    });
    if (this.window.localStorage.dateFormat) {
      this.dateFormat = this.window.localStorage.getItem('dateFormat');
    }
    if (this.window.localStorage.timeFormat) {
      this.timeFormat = this.window.localStorage.getItem('timeFormat');
    }
  }

  transform(value: Date | number, timezone?: string, dateFormat?: string, timeFormat?: string): string {
    if (dateFormat) {
      this.dateFormat = dateFormat;
    }
    if (timeFormat) {
      this.timeFormat = timeFormat;
    }

    return this.localeService.formatDateTime(value, timezone);
  }
}
