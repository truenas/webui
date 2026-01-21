import { addTwelveHourTimeFormat, formatTimeWith12Hour } from 'app/modules/scheduler/utils/time-format.utils';

describe('formatTimeWith12Hour', () => {
  it('formats midnight correctly', () => {
    expect(formatTimeWith12Hour('00:00')).toBe('00:00 (12:00 AM)');
  });

  it('formats noon correctly', () => {
    expect(formatTimeWith12Hour('12:00')).toBe('12:00 (12:00 PM)');
  });

  it('formats afternoon times correctly', () => {
    expect(formatTimeWith12Hour('13:12')).toBe('13:12 (01:12 PM)');
    expect(formatTimeWith12Hour('23:59')).toBe('23:59 (11:59 PM)');
  });

  it('handles invalid time format gracefully', () => {
    jest.spyOn(console, 'warn').mockImplementation();
    expect(formatTimeWith12Hour('invalid')).toBe('invalid');
    expect(console.warn).toHaveBeenCalledWith('Invalid time format: invalid');
    jest.restoreAllMocks();
  });
});

describe('addTwelveHourTimeFormat', () => {
  it('replaces all time patterns in description', () => {
    expect(addTwelveHourTimeFormat('At 02:00, every day'))
      .toBe('At 02:00 (02:00 AM), every day');
  });

  it('handles multiple times in one string', () => {
    expect(addTwelveHourTimeFormat('From 09:00 to 17:30'))
      .toBe('From 09:00 (09:00 AM) to 17:30 (05:30 PM)');
  });
});
