import { Cron } from 'croner';
import {
  addDays, addMinutes,
  endOfMonth,
  getDate, getMonth, isAfter, isBefore, isWithinInterval,
  setHours,
  setMinutes,
  subMinutes,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export interface CronSchedulerPreviewOptions {
  crontab: string;
  startTime?: string;
  endTime?: string;
}

export class CronSchedulePreview {
  private readonly cron: Cron;

  constructor(private options: CronSchedulerPreviewOptions) {
    this.cron = new Cron(this.options.crontab, {
      legacyMode: true,
    });
  }

  /**
   * Returns next {limit} dates from startDate to the end of month.
   * @param startDate Starting date.
   * @param limit
   */
  listNextRunsInMonth(startDate: Date, limit: number, timezone: string): Date[] {
    const nextRuns: Date[] = [];
    let previousDate = subMinutes(startDate, 1);
    const endDate = endOfMonth(startDate);

    for (let i = 0; i < limit;) {
      const exampleDate = this.cron.nextRun(previousDate);
      previousDate = exampleDate;

      if (!exampleDate || !isBefore(exampleDate, endDate)) {
        break;
      }

      if (!this.isWithinTimeConstrains(exampleDate)) {
        continue;
      }

      const machineToUtc = zonedTimeToUtc(exampleDate, timezone);

      const utcToLocal = utcToZonedTime(machineToUtc, Intl.DateTimeFormat().resolvedOptions().timeZone);

      nextRuns.push(utcToLocal);
      i = i + 1;
    }

    return nextRuns;
  }

  getNextDaysInMonthWithRuns(startDate: Date): Set<number> {
    const monthDaysWithRuns = new Set<number>([]);

    let previousDate = startDate;
    const startingMonth = getMonth(previousDate);

    do {
      const nextRun = this.cron.nextRun(subMinutes(previousDate, 1));

      if (!nextRun || getMonth(nextRun) !== startingMonth) {
        break;
      }

      if (!this.isWithinTimeConstrains(nextRun)) {
        previousDate = addMinutes(nextRun, 1);
        continue;
      }

      previousDate = addDays(previousDate, 1);

      const dayNumber = getDate(nextRun);
      monthDaysWithRuns.add(dayNumber);
    } while (getMonth(previousDate) === startingMonth);

    return monthDaysWithRuns;
  }

  private isWithinTimeConstrains(date: Date): boolean {
    if (!this.options.startTime || !this.options.endTime) {
      return true;
    }

    const [startHour, startMinutes] = this.options.startTime.split(':');
    const [endHour, endMinutes] = this.options.endTime.split(':');

    const startDate = setMinutes(setHours(date, Number(startHour)), Number(startMinutes));
    const endDate = setMinutes(setHours(date, Number(endHour)), Number(endMinutes));

    if (!isAfter(endDate, startDate)) {
      return true;
    }

    return isWithinInterval(date, { start: startDate, end: endDate });
  }
}
