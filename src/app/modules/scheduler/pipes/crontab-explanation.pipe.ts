import { Pipe, PipeTransform } from '@angular/core';
import cronstrue from 'cronstrue/i18n';

@Pipe({
  name: 'crontabExplanation',
})
export class CrontabExplanationPipe implements PipeTransform {
  transform(crontab: string): any {
    return cronstrue.toString(crontab);
  }
}
