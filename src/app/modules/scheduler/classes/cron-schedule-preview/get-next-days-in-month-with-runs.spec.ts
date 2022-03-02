import { range } from 'lodash';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';

describe('CronSchedulePreview - getNextDaysInMonthWithRuns', () => {
  describe('Every Minute - * * * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '* * * * *',
        timezone: 'America/New_York',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-19 10:45:02');

      expect(Array.from(nextRuns.values())).toEqual(range(19, 28 + 1));
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-03-01 0:00:00');

      expect(Array.from(nextRuns.values())).toEqual(range(1, 31 + 1));
    });

    it('lists last day in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-28 23:59:00');

      expect(Array.from(nextRuns.values())).toEqual([28]);
    });
  });

  describe('Every hour - 0 * * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 * * * *',
        timezone: 'America/New_York',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-19 10:45:02');

      expect(Array.from(nextRuns.values())).toEqual(range(19, 28 + 1));
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-03-01 0:00:00');

      expect(Array.from(nextRuns.values())).toEqual(range(1, 31 + 1));
    });

    it('lists last day in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-28 0:00:00');

      expect(Array.from(nextRuns.values())).toEqual([28]);
    });
  });

  describe('Every day - 0 0 * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 0 * * *',
        timezone: 'America/New_York',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-19 10:45:02');

      expect(Array.from(nextRuns.values())).toEqual(range(20, 28 + 1));
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-03-01 0:00:00');

      expect(Array.from(nextRuns.values())).toEqual(range(1, 31 + 1));
    });

    it('lists last day in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-28 0:00:00');

      expect(Array.from(nextRuns.values())).toEqual([28]);
    });
  });

  describe('Every Week - 15 9 * * mon', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '15 9 * * mon',
        timezone: 'America/New_York',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-19 10:45:02');

      expect(Array.from(nextRuns.values())).toEqual([21, 28]);
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-03-01 0:00:00');

      expect(Array.from(nextRuns.values())).toEqual([7, 14, 21, 28]);
    });
  });

  describe('Every Month - 59 23 27 * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 0 19 * *',
        timezone: 'America/New_York',
      });
    });

    it('lists remaining days in current month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-02-19 0:0:0');

      expect(Array.from(nextRuns.values())).toEqual([19]);
    });

    it('lists days in next month', () => {
      const nextRuns = cron.getNextDaysInMonthWithRuns('2022-03-01 00:00:00');

      expect(Array.from(nextRuns.values())).toEqual([19]);
    });
  });
});
