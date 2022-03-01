import { Schedule } from 'app/interfaces/schedule.interface';

export function scheduleToCrontab(schedule: Schedule): string {
  return `${schedule.minute} ${schedule.hour} ${schedule.dom} ${schedule.month} ${schedule.dow}`;
}

export function crontabToSchedule(crontab: string): Schedule {
  const [minute, hour, dom, month, dow] = crontab.split(' ');

  return {
    minute,
    hour,
    dom,
    month,
    dow,
  };
}
