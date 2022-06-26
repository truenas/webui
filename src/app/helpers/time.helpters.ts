import { intervalToDuration } from 'date-fns';

export function secondsToDuration(seconds: number): Duration {
  return intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });
}
