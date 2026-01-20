import { Pipe, PipeTransform, inject } from '@angular/core';
import cronstrue from 'cronstrue/i18n';
import { format, parse } from 'date-fns';
import { LanguageService } from 'app/modules/language/language.service';

@Pipe({
  name: 'crontabExplanation',
})
export class CrontabExplanationPipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(crontab: string): string {
    const cronstrueOptions = {
      use24HourTimeFormat: true,
      verbose: true,
      locale: this.language.currentLanguage,
    };

    const description = cronstrue.toString(crontab, cronstrueOptions);
    return this.addTwelveHourTimeFormat(description);
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
