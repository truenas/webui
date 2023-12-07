import { Schedule } from 'app/interfaces/schedule.interface';

export function scheduleToCrontab(schedule: Schedule): string {
  if ('minute' in schedule) {
    return `${schedule.minute} ${schedule.hour} ${schedule.dom} ${schedule.month} ${schedule.dow}`;
  }

  return `0 ${schedule.hour} ${schedule.dom} ${schedule.month} ${schedule.dow}`;
}

export function extractActiveHoursFromCron(crontab: string): { start: string; end: string } {
  const parts = crontab.split(' ');
  const [minutes, hours] = parts;

  const formatHour = (hour: string): string => `${hour.padStart(2, '0')}:00`;

  if ((hours === '0' || hours === '00') && (minutes === '0' || minutes === '00')) {
    return { start: '00:00', end: '23:59' };
  }

  if (hours.includes('-')) {
    const range = hours.split('-');
    return { start: formatHour(range[0]), end: formatHour(range[1]) };
  }

  if (hours.includes(',')) {
    const list = hours.split(',');
    return { start: formatHour(list[0]), end: formatHour(list[list.length - 1]) };
  }

  return { start: formatHour(hours), end: formatHour(hours) };
}
