import Cron from 'croner';
import {
  addDays,
  endOfMonth,
  getDate, getMonth, isBefore, isWithinInterval,
  setHours,
  setMinutes,
  subMinutes,
} from 'date-fns';

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
  listNextRunsInMonth(startDate: Date, limit: number): Date[] {
    const nextRuns: Date[] = [];
    let previousDate = subMinutes(startDate, 1);
    const endDate = endOfMonth(startDate);

    for (let i = 0; i < limit;) {
      const exampleDate = this.cron.next(previousDate);
      previousDate = exampleDate;

      if (!exampleDate || !isBefore(exampleDate, endDate)) {
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

  getNextDaysInMonthWithRuns(startDate: Date): Set<number> {
    const monthDaysWithRuns = new Set<number>([]);

    let previousDate = startDate;
    const startingMonth = getMonth(previousDate);

    do {
      const nextRun = this.cron.next(subMinutes(previousDate, 1));

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
