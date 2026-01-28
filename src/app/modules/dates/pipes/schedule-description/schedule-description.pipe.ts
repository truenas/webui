import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import cronstrue from 'cronstrue/i18n';
import { Schedule } from 'app/interfaces/schedule.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { addTwelveHourTimeFormat, formatTimeWith12Hour } from 'app/modules/scheduler/utils/time-format.utils';

@Pipe({
  name: 'scheduleDescription',
})
export class ScheduleDescriptionPipe implements PipeTransform {
  private language = inject(LanguageService);
  private translate = inject(TranslateService);


  transform(schedule: Schedule): string {
    try {
      const crontab = scheduleToCrontab(schedule);
      const cronstrueOptions = {
        use24HourTimeFormat: true,
        verbose: true,
        locale: this.language.currentLanguage,
      };

      let description = cronstrue.toString(crontab, cronstrueOptions);
      description = addTwelveHourTimeFormat(description);

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
    return formatTimeWith12Hour(time);
  }
}
