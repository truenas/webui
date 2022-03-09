import { Schedule } from 'app/interfaces/schedule.interface';

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

export function crontabToScheduleWithoutMinutes(crontab: string): Schedule {
  const [, hour, dom, month, dow] = crontab.split(' ');

  return {
    hour,
    dom,
    month,
    dow,
  };
}
