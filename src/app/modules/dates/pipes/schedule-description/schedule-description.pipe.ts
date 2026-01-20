import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import cronstrue from 'cronstrue/i18n';
import { format, parse } from 'date-fns';
import { Schedule } from 'app/interfaces/schedule.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';

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
      description = this.addTwelveHourTimeFormat(description);

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
    const time24h = format(parsedDate, 'HH:mm');
    const time12h = format(parsedDate, 'hh:mm aa');
    return `${time24h} (${time12h})`;
  }

  private addTwelveHourTimeFormat(description: string): string {
    // Match 24-hour time patterns like "02:00", "14:30", etc.
    return description.replace(/\b(\d{2}):(\d{2})\b/g, (match, hours, minutes) => {
      try {
        const time24h = `${hours}:${minutes}`;
        const parsed = parse(time24h, 'HH:mm', new Date());
        const time12h = format(parsed, 'hh:mm aa');
        return `${time24h} (${time12h})`;
      } catch {
        return match;
      }
    });
  }
}
