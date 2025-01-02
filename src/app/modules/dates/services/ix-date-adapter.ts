import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { LocaleService } from 'app/modules/language/locale.service';

/**
 * This is to be provided in components when we need to format and parse a date according
 * to the time format user has selected in the preferences.
 *
 * TODO: It may be better to provide MAT_DATE_FORMATS and use provideDateFnsAdapter instead.
 */
// eslint-disable-next-line angular-file-naming/service-filename-suffix
@Injectable()
export class IxDateAdapter extends NativeDateAdapter {
  constructor(
    private localeService: LocaleService,
    private formatDateTime: FormatDateTimePipe,
  ) {
    super();
  }

  override format(date: Date, format: { year: string; month: string; day?: string }): string {
    if (!('day' in format)) {
      return super.format(date, format);
    }
    // TODO: Pipe does not support disabling time formatting properly.
    return this.formatDateTime.transform(date, undefined, ' ');
  }

  override parse(value: unknown, _?: unknown): Date | null {
    if (typeof value !== 'string' || !value) {
      return super.parse(value);
    }

    return this.localeService.getDateFromString(value);
  }
}
