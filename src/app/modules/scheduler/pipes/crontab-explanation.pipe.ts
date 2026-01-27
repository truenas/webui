import { Pipe, PipeTransform, inject } from '@angular/core';
import cronstrue from 'cronstrue/i18n';
import { LanguageService } from 'app/modules/language/language.service';
import { addTwelveHourTimeFormat } from 'app/modules/scheduler/utils/time-format.utils';

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
    return addTwelveHourTimeFormat(description);
  }
}
