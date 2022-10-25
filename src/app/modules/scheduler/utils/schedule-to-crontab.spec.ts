import { Schedule } from 'app/interfaces/schedule.interface';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';

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
});
