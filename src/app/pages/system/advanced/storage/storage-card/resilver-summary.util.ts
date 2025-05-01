import { TranslateService } from '@ngx-translate/core';
import { Weekday, weekdayLabels } from 'app/enums/weekday.enum';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Produces strings likes:
 * - Never
 * - Between <time> and <time> every day of the week
 * - Between <time> and <time> on weekends
 * - Between <time> and <time> on weekdays
 * - Between <time> and <time> on Monday, Tuesday
 */
export function getResilverSummary(config: ResilverConfig, translate: TranslateService): TranslatedString {
  if (!config.enabled) {
    return translate.instant('Never');
  }

  let dayExplanation = '';
  switch (true) {
    case config.weekday.length === 7:
      dayExplanation = translate.instant('every day of the week');
      break;
    case config.weekday.length === 2
      && config.weekday.includes(Weekday.Saturday)
      && config.weekday.includes(Weekday.Sunday):
      dayExplanation = translate.instant('on weekends');
      break;
    case config.weekday.length === 5
      && !config.weekday.includes(Weekday.Saturday)
      && !config.weekday.includes(Weekday.Sunday):
      dayExplanation = translate.instant('on weekdays');
      break;
    default: {
      const days = config.weekday.map((day) => weekdayLabels.get(day));
      dayExplanation = translate.instant('on {days}', { days: days.join(', ') });
    }
  }

  return translate.instant('Between {startTime} and {endTime} {onDays}', {
    startTime: config.begin,
    endTime: config.end,
    onDays: dayExplanation,
  });
}
