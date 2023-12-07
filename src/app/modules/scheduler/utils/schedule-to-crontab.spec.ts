import { Schedule } from 'app/interfaces/schedule.interface';
import { extractActiveHoursFromCron, scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';

describe('scheduleToCrontab', () => {
  it('converts schedule with minutes to crontab', () => {
    const schedule: Schedule = {
      minute: '15',
      hour: '10',
      dom: '*',
      dow: '6',
      month: '2-5',
    };

    expect(scheduleToCrontab(schedule)).toBe('15 10 * 2-5 6');
  });

  it('converts scheduler without minutes to crontab', () => {
    const schedule: Schedule = {
      hour: '10',
      dom: '*',
      dow: '6',
      month: '2-5',
    };

    expect(scheduleToCrontab(schedule)).toBe('0 10 * 2-5 6');
  });

  it('extracts start and end value from crontab', () => {
    expect(extractActiveHoursFromCron('15 10 * 2-5 6')).toEqual({ start: '10:15', end: '10:15' });
    expect(extractActiveHoursFromCron('15,25,35 10 * 2-5 6')).toEqual({ start: '10:15,25,35', end: '10:15,25,35' });
    expect(extractActiveHoursFromCron('0 08-18 * * mon,tue,wed,thu,fri,sat')).toEqual({ start: '08:00', end: '18:00' });
    expect(extractActiveHoursFromCron('0 08,10 * * *')).toEqual({ start: '08:00', end: '10:00' });
    expect(extractActiveHoursFromCron('0 0 * * *')).toEqual({ start: '00:00', end: '23:59' });
  });
});
