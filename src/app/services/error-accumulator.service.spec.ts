import { Injector } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { KiB } from 'app/constants/bytes.constant';
import { ErrorAccumulatorService } from 'app/services/error-accumulator.service';

describe('ErrorAccumulatorService', () => {
  let spectator: SpectatorService<ErrorAccumulatorService>;
  const createService = createServiceFactory({
    service: ErrorAccumulatorService,
    providers: [
      mockProvider(Injector, {
        get: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('appendError', () => {
    it('appends error to logs list', () => {
      jest.spyOn(spectator.service, 'appendError');
      spectator.service.appendError('error message 1');
      spectator.service.appendError('error message 2');

      expect(spectator.service.getErrorLogs()).toBe(
        'error message 1\nerror message 2',
      );

      spectator.service.appendError('error message 3');

      expect(spectator.service.getErrorLogs()).toBe(
        'error message 1\nerror message 2\nerror message 3',
      );
    });

    it('truncates logs when overflowing', () => {
      jest.spyOn(spectator.service, 'appendError');
      const fakeErrors = {
        errorA: 'a'.repeat(KiB * 10),
        errorB: 'b'.repeat(KiB * 10),
        errorC: 'c'.repeat(KiB * 10),
        errorD: 'd'.repeat(KiB * 10),
        errorE: 'e'.repeat(KiB * 10),
        errorF: 'f'.repeat(KiB * 10),
      };

      Object.values(fakeErrors).forEach((error) => spectator.service.appendError(error));

      expect(spectator.service.getErrorLogs()).toBe(
        `${fakeErrors.errorC}\n${fakeErrors.errorD}\n${fakeErrors.errorE}\n${fakeErrors.errorF}`,
      );
    });
  });
});
