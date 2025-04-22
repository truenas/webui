import { Pipe, PipeTransform } from '@angular/core';
import { Schedule } from 'app/interfaces/schedule.interface';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';

@Pipe({
  name: 'scheduleToCrontab',
})
export class ScheduleToCrontabPipe implements PipeTransform {
  transform(value: Schedule): string {
    return scheduleToCrontab(value);
  }
}
