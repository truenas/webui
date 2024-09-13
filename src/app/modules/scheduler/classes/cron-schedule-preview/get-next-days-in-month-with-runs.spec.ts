import { range } from 'lodash-es';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';

describe('CronSchedulePreview - getNextDaysInMonthWithRuns', () => {
  describe('Every Minute - * * * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '* * * * *',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-19 10:45:02'));

      expect(Array.from(nextRuns.values())).toEqual(range(19, 28 + 1));
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-03-01 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual(range(1, 31 + 1));
    });

    it('lists last day in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-28 23:59:00'));

      expect(Array.from(nextRuns.values())).toEqual([28]);
    });
  });

  describe('Every hour - 0 * * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 * * * *',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-19 10:45:02'));

      expect(Array.from(nextRuns.values())).toEqual(range(19, 28 + 1));
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-03-01 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual(range(1, 31 + 1));
    });

    it('lists last day in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-28 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual([28]);
    });
  });

  describe('Every day - 0 0 * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 0 * * *',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-19 10:45:02'));

      expect(Array.from(nextRuns.values())).toEqual(range(20, 28 + 1));
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-03-01 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual(range(1, 31 + 1));
    });

    it('lists last day in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-28 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual([28]);
    });
  });

  describe('Mixing day of month and day of week conditions', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 0 1 * 6',
      });
    });

    it('lists next runs with OR condition when both day of month and day of week are set', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-04-01 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual([1, 2, 9, 16, 23, 30]);
    });
  });

  describe('Every Week - 15 9 * * mon', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '15 9 * * mon',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-19 10:45:02'));

      expect(Array.from(nextRuns.values())).toEqual([21, 28]);
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-03-01 0:00:00'));

      expect(Array.from(nextRuns.values())).toEqual([7, 14, 21, 28]);
    });
  });

  describe('Every Month - 59 23 27 * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 0 19 * *',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-02-19 0:0:0'));

      expect(Array.from(nextRuns.values())).toEqual([19]);
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns(new Date('2022-03-01 00:00:00'));

      expect(Array.from(nextRuns.values())).toEqual([19]);
    });
  });
});
