import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { IxFormatterService } from 'app/pages/common/ix-forms/services/ix-formatter.service';

describe('IxFormatterService', () => {
  let spectator: SpectatorService<IxFormatterService>;

  const createService = createServiceFactory({
    service: IxFormatterService,
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
      expect(parsed).toBe(null);
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
});
