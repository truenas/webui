import { format, parse } from 'date-fns';

/**
 * Fixed reference date for time parsing to ensure consistent results
 * regardless of current date/timezone. The specific date is arbitrary -
 * only the time component matters for formatting.
 */
const timeReferenceDate = new Date(2000, 0, 1);

export function formatTimeWith12Hour(time24h: string): string {
  try {
    const parsed = parse(time24h, 'HH:mm', timeReferenceDate);
    const time12h = format(parsed, 'hh:mm aa');
    return `${time24h} (${time12h})`;
  } catch {
    console.warn(`Invalid time format: ${time24h}`);
    return time24h;
  }
}

export function addTwelveHourTimeFormat(description: string): string {
  // Match 24-hour time patterns like "02:00", "14:30", etc.
  return description.replace(/\b(\d{2}):(\d{2})\b/g, (match, hours, minutes) => {
    return formatTimeWith12Hour(`${hours}:${minutes}`);
  });
}
