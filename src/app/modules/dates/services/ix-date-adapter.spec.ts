import { NativeDateAdapter } from '@angular/material/core';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { LocaleService } from 'app/modules/language/locale.service';
import { IxDateAdapter } from './ix-date-adapter';

describe('IxDateAdapter', () => {
  let spectator: SpectatorService<IxDateAdapter>;
  const createService = createServiceFactory({
    service: IxDateAdapter,
    mocks: [LocaleService, FormatDateTimePipe],
    providers: [
      { provide: NativeDateAdapter, useValue: {} },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('format', () => {
    it('should use FormatDateTimePipe for normal long dates', () => {
      const mockDate = new Date(2023, 10, 25);
      const formattedDate = '25/11/2023';
      spectator.inject(FormatDateTimePipe).transform.mockReturnValue(formattedDate);

      const result = spectator.service.format(mockDate, { year: 'numeric', month: 'numeric', day: 'numeric' });

      expect(spectator.inject(FormatDateTimePipe).transform).toHaveBeenCalledWith(mockDate, undefined, ' ');
      expect(result).toBe(formattedDate);
    });

    it('should fallback to super.format when short date is requested ("day" is not in the format)', () => {
      const mockDate = new Date(2023, 10, 25);
      jest.spyOn(NativeDateAdapter.prototype, 'format').mockReturnValue('11/2023');

      const result = spectator.service.format(mockDate, { year: 'numeric', month: 'numeric' });

      expect(result).toBe('11/2023');
      expect(NativeDateAdapter.prototype.format).toHaveBeenCalledWith(mockDate, { year: 'numeric', month: 'numeric' });
    });
  });

  describe('parse', () => {
    it('should return null if the value is not a string or is empty', () => {
      expect(spectator.service.parse('')).toBeNull();
      expect(spectator.service.parse(null)).toBeNull();
      expect(spectator.service.parse(undefined)).toBeNull();
    });

    it('should use LocaleService to parse valid string values', () => {
      const dateString = '2023-11-25';
      const mockDate = new Date(2023, 10, 25);
      spectator.inject(LocaleService).getDateFromString.mockReturnValue(mockDate);

      const result = spectator.service.parse(dateString);

      expect(spectator.inject(LocaleService).getDateFromString).toHaveBeenCalledWith(dateString);
      expect(result).toBe(mockDate);
    });
  });
});
