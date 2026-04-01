import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DialogService', () => {
  let spectator: SpectatorService<DialogService>;

  const createService = createServiceFactory({
    service: DialogService,
    providers: [
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('confirmDelete', () => {
    function mockConfirm(result: boolean): void {
      jest.spyOn(spectator.service, 'confirm').mockReturnValue(of(result) as never);
    }

    it('shows confirmation dialog and executes api call on confirm', () => {
      const callFn = jest.fn(() => of(true));
      mockConfirm(true);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete this item?'),
        call: callFn,
      }).subscribe();

      expect(spectator.service.confirm).toHaveBeenCalledWith({
        title: 'Delete',
        message: ignoreTranslation('Delete this item?'),
        buttonText: 'Delete',
        buttonColor: 'warn',
      });
      expect(callFn).toHaveBeenCalled();
    });

    it('does not execute api call when user cancels', () => {
      const callFn = jest.fn(() => of(true));
      mockConfirm(false);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete this item?'),
        call: callFn,
      }).subscribe();

      expect(callFn).not.toHaveBeenCalled();
    });

    it('shows success snackbar after successful deletion', () => {
      mockConfirm(true);
      const snackbar = spectator.inject(SnackbarService);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete this item?'),
        call: () => of(true),
        successMessage: ignoreTranslation('Item deleted.'),
      }).subscribe();

      expect(snackbar.success).toHaveBeenCalledWith(ignoreTranslation('Item deleted.'));
    });

    it('does not show snackbar when no success message is provided', () => {
      mockConfirm(true);
      const snackbar = spectator.inject(SnackbarService);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete this item?'),
        call: () => of(true),
      }).subscribe();

      expect(snackbar.success).not.toHaveBeenCalled();
    });

    it('uses custom title and button text when provided', () => {
      mockConfirm(false);

      spectator.service.confirmDelete({
        title: ignoreTranslation('Remove Interface'),
        message: ignoreTranslation('Delete this interface?'),
        buttonText: ignoreTranslation('Remove'),
        call: () => of(true),
      }).subscribe();

      expect(spectator.service.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: ignoreTranslation('Remove Interface'),
          buttonText: ignoreTranslation('Remove'),
        }),
      );
    });

    it('shows loader during api call execution', () => {
      mockConfirm(true);
      const loader = spectator.inject(LoaderService);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete?'),
        call: () => of(true),
      }).subscribe();

      expect(loader.withLoader).toHaveBeenCalled();
    });

    it('handles errors via error handler', () => {
      mockConfirm(true);
      const errorHandler = spectator.inject(ErrorHandlerService);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete?'),
        call: () => throwError(() => new Error('API failure')),
      }).subscribe();

      expect(errorHandler.withErrorHandler).toHaveBeenCalled();
    });

    it('opens job dialog for job-based deletions', () => {
      const job$ = of({ id: 1 } as Job);
      mockConfirm(true);
      jest.spyOn(spectator.service, 'jobDialog').mockReturnValue({
        afterClosed: () => of({ id: 1 } as Job),
      } as ReturnType<DialogService['jobDialog']>);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete tunable?'),
        job: () => job$,
        jobProgressTitle: ignoreTranslation('Deleting...'),
        successMessage: ignoreTranslation('Deleted.'),
      }).subscribe();

      expect(spectator.service.jobDialog).toHaveBeenCalledWith(job$, {
        title: ignoreTranslation('Deleting...'),
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(ignoreTranslation('Deleted.'));
    });

    it('does not use loader for job-based deletions but still handles errors', () => {
      mockConfirm(true);
      jest.spyOn(spectator.service, 'jobDialog').mockReturnValue({
        afterClosed: () => of({ id: 1 } as Job),
      } as ReturnType<DialogService['jobDialog']>);
      const loader = spectator.inject(LoaderService);
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.clearAllMocks();

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete?'),
        job: () => of({ id: 1 } as Job),
      }).subscribe();

      expect(loader.withLoader).not.toHaveBeenCalled();
      expect(errorHandler.withErrorHandler).toHaveBeenCalled();
    });

    it('uses default jobProgressTitle when not provided', () => {
      mockConfirm(true);
      jest.spyOn(spectator.service, 'jobDialog').mockReturnValue({
        afterClosed: () => of({ id: 1 } as Job),
      } as ReturnType<DialogService['jobDialog']>);

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete?'),
        job: () => of({ id: 1 } as Job),
      }).subscribe();

      expect(spectator.service.jobDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ title: 'Deleting...' }),
      );
    });

    it('emits void on successful deletion for subscriber to refresh', () => {
      mockConfirm(true);
      const nextFn = jest.fn();

      spectator.service.confirmDelete({
        message: ignoreTranslation('Delete?'),
        call: () => of(true),
      }).subscribe(nextFn);

      expect(nextFn).toHaveBeenCalledWith(undefined);
    });
  });
});
