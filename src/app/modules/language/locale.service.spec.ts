import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { LocaleService } from 'app/modules/language/locale.service';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('LocaleService', () => {
  let spectator: SpectatorService<LocaleService>;
  let service: LocaleService;

  const createService = createServiceFactory({
    service: LocaleService,
    mocks: [Store],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;

    const store$ = spectator.inject(Store);
    store$.select.mockImplementation((selector: unknown) => {
      if (selector === selectTimezone) {
        return of('UTC');
      }

      if (selector === waitForPreferences) {
        return of({ dateFormat: 'yyyy-MM-dd', timeFormat: 'HH:mm:ss' });
      }

      return of(null);
    });

    jest.useFakeTimers().setSystemTime(new Date('2024-08-14T14:14:27Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDateFormatOptions', () => {
    it('should return correct date format options for default timezone', () => {
      const options = service.getDateFormatOptions();
      expect(options).toEqual([
        { label: '2024-08-14', value: 'yyyy-MM-dd' },
        { label: 'August 14, 2024', value: 'MMMM d, yyyy' },
        { label: '14 August, 2024', value: 'd MMMM, yyyy' },
        { label: 'Aug 14, 2024', value: 'MMM d, yyyy' },
        { label: '14 Aug 2024', value: 'd MMM yyyy' },
        { label: '08/14/2024', value: 'MM/dd/yyyy' },
        { label: '14/08/2024', value: 'dd/MM/yyyy' },
        { label: '14.08.2024', value: 'dd.MM.yyyy' },
      ]);
    });
  });

  describe('getTimeFormatOptions', () => {
    it('should return correct time format options for default timezone', () => {
      const options = service.getTimeFormatOptions();
      expect(options).toEqual([
        { label: '17:14:27 (24 Hours)', value: 'HH:mm:ss' },
        { label: '05:14:27 pm', value: "hh:mm:ss aaaaa'm'" },
        { label: '05:14:27 PM', value: 'hh:mm:ss aa' },
      ]);
    });
  });

  describe('getDateFromString', () => {
    it('should correctly parse a valid date string with default timezone', () => {
      const date = service.getDateFromString('14/08/2024 02:00:00');
      expect(date.toISOString()).toBe('2024-08-13T23:00:00.000Z');
    });

    it('should correctly parse a valid date string with another format with default timezone', () => {
      const date = service.getDateFromString('14.08.2024 02:00:00');
      expect(date.toISOString()).toBe('2024-08-13T23:00:00.000Z');
    });

    it('should throw an error for an invalid date string', () => {
      expect(() => service.getDateFromString('invalid date')).toThrow('Invalid date format: invalid date');
    });
  });

  describe('getPreferredDateFormat', () => {
    it('should return the preferred date format', () => {
      expect(service.getPreferredDateFormat()).toBe('yyyy-MM-dd');
    });
  });

  describe('getPreferredTimeFormat', () => {
    it('should return the preferred time format', () => {
      expect(service.getPreferredTimeFormat()).toBe('HH:mm:ss');
    });
  });

  describe('getDateAndTime', () => {
    it('should return the correct date and time for default timezone', () => {
      const [date, time] = service.getDateAndTime();
      expect(date).toBe('2024-08-14');
      expect(time).toBe('17:14:27');
    });

    it('should return the correct date and time for a specified timezone', () => {
      const [date, time] = service.getDateAndTime('Europe/Kiev');
      expect(date).toBe('2024-08-14');
      expect(time).toBe('17:14:27');
    });
  });

  describe('formatDateTimeToDateFns', () => {
    it('should correctly format date-time string to date-fns format', () => {
      const formatted = service.formatDateTimeToDateFns('YYYY-MM-DD A');
      expect(formatted).toBe('yyyy-MM-dd aa');
    });
  });
});
