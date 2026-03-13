import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { ConfirmDeleteCallOptions, ConfirmDeleteJobOptions } from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
      jest.spyOn(spectator.service, 'confirm').mockReturnValue(of(result));
    }

    it('shows confirmation dialog and executes api call on confirm', () => {
      const callFn = jest.fn(() => of(true));
      mockConfirm(true);

      spectator.service.confirmDelete({
        message: 'Delete this item?',
        call: callFn,
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(spectator.service.confirm).toHaveBeenCalledWith({
        title: 'Delete',
        message: 'Delete this item?',
        buttonText: 'Delete',
        buttonColor: 'warn',
      });
      expect(callFn).toHaveBeenCalled();
    });

    it('does not execute api call when user cancels', () => {
      const callFn = jest.fn(() => of(true));
      mockConfirm(false);

      spectator.service.confirmDelete({
        message: 'Delete this item?',
        call: callFn,
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(callFn).not.toHaveBeenCalled();
    });

    it('shows success snackbar after successful deletion', () => {
      mockConfirm(true);
      const snackbar = spectator.inject(SnackbarService);

      spectator.service.confirmDelete({
        message: 'Delete this item?',
        call: () => of(true),
        successMessage: 'Item deleted.',
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(snackbar.success).toHaveBeenCalledWith('Item deleted.');
    });

    it('does not show snackbar when no success message is provided', () => {
      mockConfirm(true);
      const snackbar = spectator.inject(SnackbarService);

      spectator.service.confirmDelete({
        message: 'Delete this item?',
        call: () => of(true),
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(snackbar.success).not.toHaveBeenCalled();
    });

    it('uses custom title and button text when provided', () => {
      mockConfirm(false);

      spectator.service.confirmDelete({
        title: 'Remove Interface',
        message: 'Delete this interface?',
        buttonText: 'Remove',
        call: () => of(true),
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(spectator.service.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Remove Interface',
          buttonText: 'Remove',
        }),
      );
    });

    it('shows loader during api call execution', () => {
      mockConfirm(true);
      const loader = spectator.inject(LoaderService);

      spectator.service.confirmDelete({
        message: 'Delete?',
        call: () => of(true),
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(loader.withLoader).toHaveBeenCalled();
    });

    it('handles errors via error handler', () => {
      mockConfirm(true);
      const errorHandler = spectator.inject(ErrorHandlerService);

      spectator.service.confirmDelete({
        message: 'Delete?',
        call: () => throwError(() => new Error('API failure')),
      } as unknown as ConfirmDeleteCallOptions).subscribe();

      expect(errorHandler.withErrorHandler).toHaveBeenCalled();
    });

    it('opens job dialog for job-based deletions', () => {
      const job$ = of({ id: 1 } as Job);
      mockConfirm(true);
      jest.spyOn(spectator.service, 'jobDialog').mockReturnValue({
        afterClosed: () => of({ id: 1 } as Job),
      } as ReturnType<DialogService['jobDialog']>);

      spectator.service.confirmDelete({
        message: 'Delete tunable?',
        job: () => job$,
        jobProgressTitle: 'Deleting...',
        successMessage: 'Deleted.',
      } as unknown as ConfirmDeleteJobOptions).subscribe();

      expect(spectator.service.jobDialog).toHaveBeenCalledWith(job$, {
        title: 'Deleting...',
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Deleted.');
    });

    it('does not use loader for job-based deletions', () => {
      mockConfirm(true);
      jest.spyOn(spectator.service, 'jobDialog').mockReturnValue({
        afterClosed: () => of({ id: 1 } as Job),
      } as ReturnType<DialogService['jobDialog']>);
      const loader = spectator.inject(LoaderService);
      jest.clearAllMocks();

      spectator.service.confirmDelete({
        message: 'Delete?',
        job: () => of({ id: 1 } as Job),
      } as unknown as ConfirmDeleteJobOptions).subscribe();

      expect(loader.withLoader).not.toHaveBeenCalled();
    });

    it('emits void on successful deletion for subscriber to refresh', () => {
      mockConfirm(true);
      const nextFn = jest.fn();

      spectator.service.confirmDelete({
        message: 'Delete?',
        call: () => of(true),
      } as unknown as ConfirmDeleteCallOptions).subscribe(nextFn);

      expect(nextFn).toHaveBeenCalledWith(undefined);
    });
  });
});
