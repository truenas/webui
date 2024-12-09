import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FirstTimeWarningService } from './first-time-warning.service';

describe('FirstTimeWarningService', () => {
  let spectator: SpectatorService<FirstTimeWarningService>;
  const createService = createServiceFactory({
    service: FirstTimeWarningService,
    providers: [
      mockProvider(DialogService, {
        warn: jest.fn(() => of(true)),
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('showFirstTimeWarningIfNeeded', () => {
    it('shows the warning dialog for the first time and adds it to the shownWarnings set', () => {
      const mockDialogService = spectator.inject(DialogService);

      const title = 'Test Warning Title';
      const message = 'Test Warning Message';

      spectator.service.showFirstTimeWarningIfNeeded(title, message).subscribe((result) => {
        expect(result).toBe(true);
        expect(mockDialogService.warn).toHaveBeenCalledWith(title, message);
        expect(spectator.service.shownWarnings.has(`${title}::${message}`)).toBe(true);
      });
    });

    it('does not show the warning dialog if it has already been shown', () => {
      const mockDialogService = spectator.inject(DialogService);

      const title = 'Test Warning Title';
      const message = 'Test Warning Message';

      spectator.service.shownWarnings.add(`${title}::${message}`);

      spectator.service.showFirstTimeWarningIfNeeded(title, message).subscribe((result) => {
        expect(result).toBe(true);
        expect(mockDialogService.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe('showFirstTimeConfirmationIfNeeded', () => {
    it('shows the confirmation dialog for the first time and adds it to the shownConfirmations set', () => {
      const mockDialogService = spectator.inject(DialogService);

      const options = {
        title: 'Test Confirmation Title',
        message: 'Test Confirmation Message',
      };

      spectator.service.showFirstTimeConfirmationIfNeeded(options).subscribe((result) => {
        expect(result).toBe(true);
        expect(mockDialogService.confirm).toHaveBeenCalledWith(options);
        expect(spectator.service.shownConfirmations.has(`${options.title}::${options.message}`)).toBe(true);
      });
    });

    it('does not show the confirmation dialog if it has already been shown', () => {
      const mockDialogService = spectator.inject(DialogService);

      const options = {
        title: 'Test Confirmation Title',
        message: 'Test Confirmation Message',
      };

      spectator.service.shownConfirmations.add(`${options.title}::${options.message}`);

      spectator.service.showFirstTimeConfirmationIfNeeded(options).subscribe((result) => {
        expect(result).toBe(true);
        expect(mockDialogService.confirm).not.toHaveBeenCalled();
      });
    });
  });
});
