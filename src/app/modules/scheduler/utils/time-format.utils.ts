import { format, parse } from 'date-fns';

const timeReferenceDate = new Date(2000, 0, 1);

export function formatTimeWith12Hour(time24h: string): string {
  const parsed = parse(time24h, 'HH:mm', timeReferenceDate);
  const time12h = format(parsed, 'hh:mm aa');
  return `${time24h} (${time12h})`;
}

export function addTwelveHourTimeFormat(description: string): string {
  // Match 24-hour time patterns like "02:00", "14:30", etc.
  return description.replace(/\b(\d{2}):(\d{2})\b/g, (match, hours, minutes) => {
    try {
      return formatTimeWith12Hour(`${hours}:${minutes}`);
    } catch {
      return match;
    }
  });
}
