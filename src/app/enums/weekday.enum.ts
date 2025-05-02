import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum Weekday {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export const weekdayLabels = new Map<Weekday, string>([
  [Weekday.Monday, T('Monday')],
  [Weekday.Tuesday, T('Tuesday')],
  [Weekday.Wednesday, T('Wednesday')],
  [Weekday.Thursday, T('Thursday')],
  [Weekday.Friday, T('Friday')],
  [Weekday.Saturday, T('Saturday')],
  [Weekday.Sunday, T('Sunday')],
]);
