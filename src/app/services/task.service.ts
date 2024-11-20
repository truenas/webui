import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as cronParser from 'cron-parser';
import { Options as CronOptions } from 'cronstrue/dist/options';
import cronstrue from 'cronstrue/i18n';
import { invalidDate } from 'app/constants/invalid-date';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { Option } from 'app/interfaces/option.interface';
import { LocaleService } from 'app/services/locale.service';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  protected timeOptions: Option[] = [
    { label: '00:00:00', value: '00:00' },
    { label: '00:15:00', value: '00:15' },
    { label: '00:30:00', value: '00:30' },
    { label: '00:45:00', value: '00:45' },
    { label: '01:00:00', value: '01:00' },
    { label: '01:15:00', value: '01:15' },
    { label: '01:30:00', value: '01:30' },
    { label: '01:45:00', value: '01:45' },
    { label: '02:00:00', value: '02:00' },
    { label: '02:15:00', value: '02:15' },
    { label: '02:30:00', value: '02:30' },
    { label: '02:45:00', value: '02:45' },
    { label: '03:00:00', value: '03:00' },
    { label: '03:15:00', value: '03:15' },
    { label: '03:30:00', value: '03:30' },
    { label: '03:45:00', value: '03:45' },
    { label: '04:00:00', value: '04:00' },
    { label: '04:15:00', value: '04:15' },
    { label: '04:30:00', value: '04:30' },
    { label: '04:45:00', value: '04:45' },
    { label: '05:00:00', value: '05:00' },
    { label: '05:15:00', value: '05:15' },
    { label: '05:30:00', value: '05:30' },
    { label: '05:45:00', value: '05:45' },
    { label: '06:00:00', value: '06:00' },
    { label: '06:15:00', value: '06:15' },
    { label: '06:30:00', value: '06:30' },
    { label: '06:45:00', value: '06:45' },
    { label: '07:00:00', value: '07:00' },
    { label: '07:15:00', value: '07:15' },
    { label: '07:30:00', value: '07:30' },
    { label: '07:45:00', value: '07:45' },
    { label: '08:00:00', value: '08:00' },
    { label: '08:15:00', value: '08:15' },
    { label: '08:30:00', value: '08:30' },
    { label: '08:45:00', value: '08:45' },
    { label: '09:00:00', value: '09:00' },
    { label: '09:15:00', value: '09:15' },
    { label: '09:30:00', value: '09:30' },
    { label: '09:45:00', value: '09:45' },
    { label: '10:00:00', value: '10:00' },
    { label: '10:15:00', value: '10:15' },
    { label: '10:30:00', value: '10:30' },
    { label: '10:45:00', value: '10:45' },
    { label: '11:00:00', value: '11:00' },
    { label: '11:15:00', value: '11:15' },
    { label: '11:30:00', value: '11:30' },
    { label: '11:45:00', value: '11:45' },
    { label: '12:00:00', value: '12:00' },
    { label: '12:15:00', value: '12:15' },
    { label: '12:30:00', value: '12:30' },
    { label: '12:45:00', value: '12:45' },
    { label: '13:00:00', value: '13:00' },
    { label: '13:15:00', value: '13:15' },
    { label: '13:30:00', value: '13:30' },
    { label: '13:45:00', value: '13:45' },
    { label: '14:00:00', value: '14:00' },
    { label: '14:15:00', value: '14:15' },
    { label: '14:30:00', value: '14:30' },
    { label: '14:45:00', value: '14:45' },
    { label: '15:00:00', value: '15:00' },
    { label: '15:15:00', value: '15:15' },
    { label: '15:30:00', value: '15:30' },
    { label: '15:45:00', value: '15:45' },
    { label: '16:00:00', value: '16:00' },
    { label: '16:15:00', value: '16:15' },
    { label: '16:30:00', value: '16:30' },
    { label: '16:45:00', value: '16:45' },
    { label: '17:00:00', value: '17:00' },
    { label: '17:15:00', value: '17:15' },
    { label: '17:30:00', value: '17:30' },
    { label: '17:45:00', value: '17:45' },
    { label: '18:00:00', value: '18:00' },
    { label: '18:15:00', value: '18:15' },
    { label: '18:30:00', value: '18:30' },
    { label: '18:45:00', value: '18:45' },
    { label: '19:00:00', value: '19:00' },
    { label: '19:15:00', value: '19:15' },
    { label: '19:30:00', value: '19:30' },
    { label: '19:45:00', value: '19:45' },
    { label: '20:00:00', value: '20:00' },
    { label: '20:15:00', value: '20:15' },
    { label: '20:30:00', value: '20:30' },
    { label: '20:45:00', value: '20:45' },
    { label: '21:00:00', value: '21:00' },
    { label: '21:15:00', value: '21:15' },
    { label: '21:30:00', value: '21:30' },
    { label: '21:45:00', value: '21:45' },
    { label: '22:00:00', value: '22:00' },
    { label: '22:15:00', value: '22:15' },
    { label: '22:30:00', value: '22:30' },
    { label: '22:45:00', value: '22:45' },
    { label: '23:00:00', value: '23:00' },
    { label: '23:15:00', value: '23:15' },
    { label: '23:30:00', value: '23:30' },
    { label: '23:45:00', value: '23:45' },
    { label: '23:59:00', value: '23:59' },
  ];

  protected cronOptions: CronOptions = {
    verbose: true,
    locale: this.language.currentLanguage,
  };

  constructor(
    protected language: LanguageService,
    protected localeService: LocaleService,
    private translate: TranslateService,
  ) {}

  getTimeOptions(): Option[] {
    return this.timeOptions;
  }

  getTaskNextRun(scheduleExpression: string): string {
    try {
      const schedule = cronParser.parseExpression(scheduleExpression, {
        iterator: true,
        tz: this.localeService.timezone,
      });

      const date = schedule?.next()?.value?.toDate();
      if (!date) {
        return this.translate.instant('N/A');
      }

      return formatDistanceToNowShortened(date);
    } catch {
      return this.translate.instant(invalidDate);
    }
  }

  getTaskNextTime(scheduleExpression: string): Date | string {
    try {
      const schedule = cronParser.parseExpression(scheduleExpression, {
        iterator: true,
        tz: this.localeService.timezone,
      });

      return schedule.next().value.toDate();
    } catch {
      return this.translate.instant(invalidDate);
    }
  }

  /**
   * @deprecated Use crontabDescription pipe.
   */
  getTaskCronDescription(scheduleExpression: string, options: CronOptions = this.cronOptions): string {
    options.use24HourTimeFormat = this.localeService.getPreferredTimeFormat() === 'HH:mm:ss';
    return cronstrue.toString(scheduleExpression, options);
  }
}
