import { computed, inject, Provider } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { TN_CALENDAR_INTL, type TnCalendarIntl } from '@truenas/ui-components';

/**
 * How many years the calendar's year view shows at a time. The library builds its own
 * default label from this number but does not export it, so it is restated here.
 */
const yearsPerPage = 24;

const labelKeys = {
  marked: T('(marked)'),
  rangeStart: T('(range start)'),
  rangeEnd: T('(range end)'),
  inRange: T('(in range)'),
  currentYear: T('(current year)'),
  yearGridLabel: T('Years {startYear} to {endYear}'),
  chooseMonthAndYear: T('Choose month and year'),
  previousMonth: T('Previous month'),
  nextMonth: T('Next month'),
  previousYears: T('Previous {years} years'),
  nextYears: T('Next {years} years'),
};

/**
 * Translates every string `tn-calendar` speaks. The library deliberately ships none, so
 * without this the calendar's arrows, grid labels and screen-reader suffixes stay English
 * whatever language the app is in.
 *
 * `monthGridLabel` is left out on purpose: its default is the identity function over an
 * already locale-formatted month and year, so there is nothing to translate. Dates
 * themselves follow `LOCALE_ID`, not this token.
 */
export function provideTnCalendarIntl(): Provider {
  return {
    provide: TN_CALENDAR_INTL,
    useFactory: () => {
      const translate = inject(TranslateService);
      const langChange = toSignal(translate.onLangChange, { initialValue: null });
      return computed<Partial<TnCalendarIntl>>(() => {
        // Read the lang-change signal so the computed re-runs after each language switch.
        langChange();
        return {
          marked: translate.instant(labelKeys.marked),
          rangeStart: translate.instant(labelKeys.rangeStart),
          rangeEnd: translate.instant(labelKeys.rangeEnd),
          inRange: translate.instant(labelKeys.inRange),
          currentYear: translate.instant(labelKeys.currentYear),
          yearGridLabel: (startYear: number, endYear: number) => translate.instant(
            labelKeys.yearGridLabel,
            { startYear, endYear },
          ),
          chooseMonthAndYear: translate.instant(labelKeys.chooseMonthAndYear),
          previousMonth: translate.instant(labelKeys.previousMonth),
          nextMonth: translate.instant(labelKeys.nextMonth),
          previousYears: translate.instant(labelKeys.previousYears, { years: yearsPerPage }),
          nextYears: translate.instant(labelKeys.nextYears, { years: yearsPerPage }),
        };
      });
    },
  };
}
