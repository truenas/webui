import { Schedule } from 'app/interfaces/schedule.interface';

export function scheduleToCrontab(schedule: Schedule): string {
  if ('minute' in schedule) {
    return `${schedule.minute} ${schedule.hour} ${schedule.dom} ${schedule.month} ${schedule.dow}`;
  }

  return `0 ${schedule.hour} ${schedule.dom} ${schedule.month} ${schedule.dow}`;
}
