import Cron from 'croner';
import {
  addDays,
  endOfMonth,
  getDate, getMonth, isBefore, isWithinInterval,
  setHours,
  setMinutes,
  subMinutes,
} from 'date-fns';
import { toDate, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export interface CronSchedulerPreviewOptions {
  crontab: string;
  timezone: string;
  startTime?: string;
  endTime?: string;
}

export class CronSchedulePreview {
  private readonly cron: Cron;
  private readonly timezone: string;

  constructor(private options: CronSchedulerPreviewOptions) {
    this.timezone = this.options.timezone;
    this.cron = new Cron(this.options.crontab, {
      timezone: this.timezone,
    });
  }

  /**
   * Returns next {limit} dates from startDate to the end of month.
   * startDate is specified in target timezone.
   * Returned dates are in local time, but stored in UTC (ordinary JS way).
   * @param startDate Starting date.
   * @param limit
   */
  listNextRunsInMonth(startDate: string, limit: number): Date[] {
    const nextRuns: Date[] = [];
    let previousDate: Date = this.getZonedStartDate(startDate);
    const zonedEndDate = this.getZonedEndDate(startDate);

    for (let i = 0; i < limit;) {
      const exampleDate = this.cron.next(previousDate);
      previousDate = exampleDate;

      if (!exampleDate || !isBefore(exampleDate, zonedEndDate)) {
        break;
      }

      if (!this.isWithinTimeConstrains(exampleDate)) {
        continue;
      }

      nextRuns.push(exampleDate);
      i = i + 1;
    }

    return nextRuns;
  }

  getNextDaysInMonthWithRuns(startDate: string): Set<number> {
    const monthDaysWithRuns = new Set<number>([]);

    let previousDate = new Date(startDate);
    const startingMonth = getMonth(previousDate);

    do {
      const zonedPreviousDate = zonedTimeToUtc(previousDate, this.timezone);
      const zonedNextRun = this.cron.next(subMinutes(zonedPreviousDate, 1));
      const nextRun = utcToZonedTime(zonedNextRun, this.timezone);

      if (!nextRun || getMonth(nextRun) !== startingMonth) {
        break;
      }

      if (!this.isWithinTimeConstrains(nextRun)) {
        previousDate = nextRun;
        continue;
      }

      previousDate = addDays(previousDate, 1);

      const dayNumber = getDate(nextRun);
      monthDaysWithRuns.add(dayNumber);
    } while (getMonth(previousDate) === startingMonth);

    return monthDaysWithRuns;
  }

  private getZonedStartDate(forMonth: string): Date {
    const zonedForMonth = toDate(forMonth, { timeZone: this.timezone });
    return subMinutes(zonedForMonth, 1);
  }

  private getZonedEndDate(forMonth: string): Date {
    const forMonthDate = new Date(forMonth);
    const endDate = endOfMonth(forMonthDate);
    return zonedTimeToUtc(endDate, this.timezone);
  }

  private isWithinTimeConstrains(date: Date): boolean {
    return true;
    // TODO: Will be implemented later.
    if (!this.options.startTime || !this.options.endTime) {
      return true;
    }

    const [startHour, startMinutes] = this.options.startTime.split(':');
    const [endHour, endMinutes] = this.options.endTime.split(':');

    const startDate = setMinutes(setHours(date, Number(startHour)), Number(startMinutes));
    const endDate = setMinutes(setHours(date, Number(endHour)), Number(endMinutes));

    return isWithinInterval(date, { start: startDate, end: endDate });
  }
}
