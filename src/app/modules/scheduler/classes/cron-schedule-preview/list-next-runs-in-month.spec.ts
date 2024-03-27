import { format } from 'date-fns-tz';
import { CronSchedulePreview } from 'app/modules/scheduler/classes/cron-schedule-preview/cron-schedule-preview';

describe('CronSchedulePreview - listNextRunsInMonth', () => {
  function toNewYorkTime(date: Date): string {
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

  describe('Every Minute - * * * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '* * * * *',
      });
    });

    it('lists next runs for remaining days in current month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-19 10:45:02'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-19 10:45:00',
        '2022-02-19 10:46:00',
        '2022-02-19 10:47:00',
      ]);
    });

    it('lists runs from start of the month next month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-03-01 00:00:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-03-01 00:00:00',
        '2022-03-01 00:01:00',
        '2022-03-01 00:02:00',
      ]);
    });

    it('lists last runs in the month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-28 23:58:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-28 23:58:00',
        '2022-02-28 23:59:00',
      ]);
    });
  });

  describe('Every hour - 0 * * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 * * * *',
      });
    });

    it('lists next runs for remaining days in current month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-19 10:45:02'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-19 11:00:00',
        '2022-02-19 12:00:00',
        '2022-02-19 13:00:00',
      ]);
    });

    it('lists run from start of the month next month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-03-01 0:00:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-03-01 00:00:00',
        '2022-03-01 01:00:00',
        '2022-03-01 02:00:00',
      ]);
    });

    it('lists last runs in the month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-28 22:00:00'), 5, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-28 22:00:00',
        '2022-02-28 23:00:00',
      ]);
    });
  });

  describe('Every day - 0 0 * * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '0 0 * * *',
      });
    });

    it('lists next runs for remaining days in current month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-19 10:45:02'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-20 00:00:00',
        '2022-02-21 00:00:00',
        '2022-02-22 00:00:00',
      ]);
    });

    it('lists run from start of the month next month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-03-01 0:00:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-03-01 00:00:00',
        '2022-03-02 00:00:00',
        '2022-03-03 00:00:00',
      ]);
    });

    it('lists last runs in a month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-27 0:00:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-27 00:00:00',
        '2022-02-28 00:00:00',
      ]);
    });
  });

  describe('Every Week - 15 9 * * mon', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '15 9 * * sun',
      });
    });

    it('lists next runs for remaining days in current month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-19 10:45:02'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-20 09:15:00',
        '2022-02-27 09:15:00',
      ]);
    });

    it('lists last sunday in the month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-27 9:15:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-27 09:15:00',
      ]);
    });
  });

  describe('Every Month - 59 23 27 * *', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '59 23 27 * *',
      });
    });

    it('lists next run for current month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-19 10:45:02'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-27 23:59:00',
      ]);
    });

    it('lists next run for next month', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-03-01 00:00:00'), 3, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-03-27 23:59:00',
      ]);
    });
  });

  describe('With startTime and endTime', () => {
    let cron: CronSchedulePreview;

    beforeEach(() => {
      cron = new CronSchedulePreview({
        crontab: '*/30 * * * *',
        startTime: '15:20',
        endTime: '17:00',
      });
    });

    it('limits runs to be within provided time boundaries', () => {
      const nextRuns = cron.listNextRunsInMonth(new Date('2022-02-19 15:00:00'), 5, 'Europe/Kiev');

      expect(nextRuns.map(toNewYorkTime)).toEqual([
        '2022-02-19 15:30:00',
        '2022-02-19 16:00:00',
        '2022-02-19 16:30:00',
        '2022-02-19 17:00:00',
        '2022-02-20 15:30:00',
      ]);
    });
  });
});
