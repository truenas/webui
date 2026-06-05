import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { ConfirmDialog } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';
import { ErrorDialog } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { MultiErrorDialog } from 'app/modules/dialog/components/multi-error-dialog/multi-error-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-empty-dialog',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyDialogComponent {}

describe('DialogService', () => {
  let spectator: SpectatorService<DialogService>;

  const createService = createServiceFactory({
    service: DialogService,
    providers: [
      mockProvider(TnDialog),
      mockProvider(Dialog),
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

  describe('closeAllDialogs', () => {
    it('delegates to cdk Dialog.closeAll()', () => {
      const cdkDialog = spectator.inject(Dialog);

      spectator.service.closeAllDialogs();

      expect(cdkDialog.closeAll).toHaveBeenCalled();
    });
  });

  function mockDialogClosed(result: boolean | undefined): jest.SpyInstance {
    return jest.spyOn(spectator.inject(TnDialog), 'open').mockReturnValue({
      closed: of(result),
    } as ReturnType<TnDialog['open']>);
  }

  describe('error', () => {
    it('returns false without opening a dialog when the report has no message', async () => {
      const open = jest.spyOn(spectator.inject(TnDialog), 'open');

      const result = await firstValueFrom(spectator.service.error({ title: 'No message' } as ErrorReport));

      expect(result).toBe(false);
      expect(open).not.toHaveBeenCalled();
    });

    it('opens ErrorDialog for a single error report', async () => {
      const open = mockDialogClosed(true);

      const result = await firstValueFrom(spectator.service.error({ message: 'Boom' } as ErrorReport));

      expect(open).toHaveBeenCalledWith(ErrorDialog, { data: { message: 'Boom' } });
      expect(result).toBe(true);
    });

    it('opens MultiErrorDialog when several reports have messages', async () => {
      const open = mockDialogClosed(true);
      const errors = [{ message: 'a' }, { message: 'b' }] as ErrorReport[];

      await firstValueFrom(spectator.service.error(errors));

      expect(open).toHaveBeenCalledWith(MultiErrorDialog, { data: errors });
    });

    it('opens a single ErrorDialog when only one report in the array has a message', async () => {
      const open = mockDialogClosed(true);
      const errors = [{ message: 'a' }, { title: 'no message' }] as ErrorReport[];

      await firstValueFrom(spectator.service.error(errors));

      expect(open).toHaveBeenCalledWith(ErrorDialog, { data: { message: 'a' } });
    });

    it('normalizes a dismissed (undefined) result to false', async () => {
      mockDialogClosed(undefined);

      const result = await firstValueFrom(spectator.service.error({ message: 'Boom' } as ErrorReport));

      expect(result).toBe(false);
    });
  });

  describe('confirm dismiss normalization', () => {
    it('normalizes dismissal to false for a plain confirm', async () => {
      mockDialogClosed(undefined);

      const result = await firstValueFrom(spectator.service.confirm({ message: ignoreTranslation('Sure?') }));

      expect(result).toBe(false);
    });

    it('normalizes dismissal to the full result shape for a secondary-checkbox confirm', async () => {
      const open = mockDialogClosed(undefined);

      const result = await firstValueFrom(spectator.service.confirm({
        message: ignoreTranslation('Sure?'),
        secondaryCheckbox: true,
      }));

      expect(open).toHaveBeenCalledWith(ConfirmDialog, expect.anything());
      expect(result).toEqual({ confirmed: false, secondaryCheckbox: false });
    });
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

// Integration check: proves a dialog opened through the wrapped TnDialog actually
// closes when closeAllDialogs() runs. This only holds because TnDialog and the
// cdk Dialog resolve to the same root singleton; assert it end-to-end with the
// real services rather than trusting that contract, since logout/websocket-drop
// rely on it. Uses a trivial component to avoid real dialogs' rendering deps.
// Standalone TestBed (not spectator) so the real Dialog/TnDialog are injected.
describe('DialogService closeAllDialogs (real cdk Dialog/TnDialog)', () => {
  let service: DialogService;
  let cdkDialog: Dialog;
  let tnDialog: TnDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DialogService,
        mockProvider(TranslateService),
        mockProvider(LoaderService),
        mockProvider(SnackbarService),
        mockProvider(ErrorHandlerService),
      ],
    });
    service = TestBed.inject(DialogService);
    cdkDialog = TestBed.inject(Dialog);
    tnDialog = TestBed.inject(TnDialog);
  });

  afterEach(() => cdkDialog?.closeAll());

  it('closes a dialog opened through TnDialog (same singleton as closeAllDialogs)', () => {
    tnDialog.open(EmptyDialogComponent);
    expect(cdkDialog.openDialogs).toHaveLength(1);

    service.closeAllDialogs();
    expect(cdkDialog.openDialogs).toHaveLength(0);
  });
});
