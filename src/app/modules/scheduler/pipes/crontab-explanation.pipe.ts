import { Pipe, PipeTransform } from '@angular/core';
import cronstrue from 'cronstrue/i18n';

@Pipe({
  name: 'crontabExplanation',
  standalone: true,
})
export class CrontabExplanationPipe implements PipeTransform {
  transform(crontab: string): string {
    return cronstrue.toString(crontab);
  }
}
