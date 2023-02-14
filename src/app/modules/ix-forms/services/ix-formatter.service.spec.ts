import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';

describe('IxFormatterService', () => {
  let spectator: SpectatorService<IxFormatterService>;

  const createService = createServiceFactory({
    service: IxFormatterService,
    providers: [
      mockWindow({
        location: {
          protocol: 'https:',
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('memorySizeFormatting', () => {
    it('should return empty string when invalid size string is passed', () => {
      const formatted = spectator.service.memorySizeFormatting('2u');
      expect(formatted).toBe('');
    });

    it('should return formatted size string when valid size in bytes is passed', () => {
      const formatted = spectator.service.memorySizeFormatting('2147483648');
      expect(formatted).toBe('2 GiB');
    });

    it('should return the value with B when no unit is provided', () => {
      const formatted = spectator.service.memorySizeFormatting('2');
      expect(formatted).toBe('2 B');
    });
  });

  describe('memorySizeParsing', () => {
    it('should return null when invalid size string is passed', () => {
      const parsed = spectator.service.memorySizeParsing('2u');
      expect(parsed).toBeNull();
    });

    it('should return value converted in bytes when valid size string is passed', () => {
      const parsed = spectator.service.memorySizeParsing('2gb');
      expect(parsed).toBe(2147483648);
    });

    it(`should convert value to MiB when no unit is passed and then return
    converted value in bytes`, () => {
      const parsed = spectator.service.memorySizeParsing('2');
      expect(parsed).toBe(2097152);
    });
  });

  describe('stringAsUrlParsing', () => {
    it('should append protocol scheme when raw IP address is passed', () => {
      const parsed = spectator.service.stringAsUrlParsing('10.20.20.10');
      expect(parsed).toBe('https://10.20.20.10');
    });

    it('should return raw value when valid url is passed', () => {
      const parsed = spectator.service.stringAsUrlParsing('http://localhost:4200');
      expect(parsed).toBe('http://localhost:4200');
    });
  });
});
