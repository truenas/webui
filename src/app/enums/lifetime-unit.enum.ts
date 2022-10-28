import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum LifetimeUnit {
  Hour = 'HOUR',
  Day = 'DAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Year = 'YEAR',
}

export const lifetimeUnitNames = new Map<LifetimeUnit, string>([
  [LifetimeUnit.Hour, T('Hour(s)')],
  [LifetimeUnit.Day, T('Day(s)')],
  [LifetimeUnit.Week, T('Week(s)')],
  [LifetimeUnit.Month, T('Month(s)')],
  [LifetimeUnit.Year, T('Year(s)')],
]);
