import {
  crontabToSchedule,
  crontabToScheduleWithoutMinutes,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';

describe('crontabToSchedule', () => {
  it('converts crontab to a schedule', () => {
    expect(crontabToSchedule('1 2 3 4 5')).toEqual({
      minute: '1',
      hour: '2',
      dom: '3',
      month: '4',
      dow: '5',
    });
  });
});

describe('crontabToScheduleWithoutMinutes', () => {
  it('converts crontab to a schedule that has no minutes', () => {
    expect(crontabToScheduleWithoutMinutes('1 2 3 4 5')).toEqual({
      hour: '2',
      dom: '3',
      month: '4',
      dow: '5',
    });
  });
});
