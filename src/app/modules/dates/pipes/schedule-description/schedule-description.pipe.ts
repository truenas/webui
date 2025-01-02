import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import cronstrue from 'cronstrue/i18n';
import { format, parse } from 'date-fns';
import { Schedule } from 'app/interfaces/schedule.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';

@Pipe({
  name: 'scheduleDescription',
})
export class ScheduleDescriptionPipe implements PipeTransform {
  constructor(
    private localeService: LocaleService,
    private language: LanguageService,
    private translate: TranslateService,
  ) {}

  transform(schedule: Schedule): string {
    try {
      const crontab = scheduleToCrontab(schedule);
      const cronstrueOptions = {
        use24HourTimeFormat: this.localeService.getPreferredTimeFormat() === 'HH:mm:ss',
        verbose: true,
        locale: this.language.currentLanguage,
      };

      const description = cronstrue.toString(crontab, cronstrueOptions);

      if (schedule.begin && schedule.end) {
        return this.translate.instant('{crontabDescription}, from {startHour} to {endHour}', {
          crontabDescription: description,
          startHour: this.formatTime(schedule.begin),
          endHour: this.formatTime(schedule.end),
        });
      }

      return description;
    } catch (error: unknown) {
      console.error(error);
      return '';
    }
  }

  private formatTime(time: string): string {
    const parsedDate = parse(time, 'HH:mm', new Date());

    return format(parsedDate, this.localeService.getShortTimeFormat());
  }
}
