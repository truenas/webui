import { formatDistanceToNow } from 'date-fns';

export function formatDistanceToNowShortened(date: Date | number): string {
  return formatDistanceToNow(date, { addSuffix: true })
    .replace('about ', '')
    .replace(' minutes', ' min.')
    .replace(' seconds', ' sec.');
}
