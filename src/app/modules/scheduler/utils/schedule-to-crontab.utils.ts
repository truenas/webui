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

  const formatTime = (hour: string, minute: string): string => `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  if ((hours === '0' || hours === '00') && (minutes === '0' || minutes === '00')) {
    return { start: '00:00', end: '23:59' };
  }

  const processRange = (range: string[], minute: string): { start: string; end: string } => {
    if (range.length === 2) {
      return { start: formatTime(range[0], minute), end: formatTime(range[1], minute) };
    }
    return { start: formatTime(range[0], minute), end: formatTime(range[0], minute) };
  };

  if (hours.includes('-')) {
    const hourRange = hours.split('-');
    return processRange(hourRange, minutes);
  }

  if (hours.includes(',')) {
    const hourList = hours.split(',');
    return {
      start: formatTime(hourList[0], minutes),
      end: formatTime(hourList[hourList.length - 1], minutes),
    };
  }

  return processRange([hours], minutes);
}
