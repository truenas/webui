import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { ConfirmDialog } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';
import { ErrorDialog } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { MultiErrorDialog } from 'app/modules/dialog/components/multi-error-dialog/multi-error-dialog.component';
import { RebootRequiredDialog } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
import { RedirectDialogData } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog-data.interface';
import { RedirectDialog } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog.component';
import { SessionExpiringDialog } from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { ShowLogsDialog } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { StartServiceDialog } from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import {
  SubsystemPartiallyCreatedDialog,
  SubsystemPartiallyCreatedDialogData,
} from 'app/modules/dialog/components/subsystem-partially-created-dialog/subsystem-partially-created-dialog.component';
import { UpdateDialog, UpdateDialogData } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
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
      mockProvider(Overlay),
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

  // These thin wrappers aren't pure passthroughs: each encodes dialog config
  // (disableClose, minWidth, panelClass, positionStrategy) that fails silently
  // if it drifts. Lock the config down so a regression is caught by a test, not
  // a user noticing a loader can suddenly be dismissed mid-update.
  describe('dialog wrapper configuration', () => {
    it('rebootRequired opens RebootRequiredDialog with a minWidth', () => {
      const open = mockDialogClosed(true);

      spectator.service.rebootRequired().subscribe();

      expect(open).toHaveBeenCalledWith(RebootRequiredDialog, { minWidth: '400px' });
    });

    it('update opens UpdateDialog anchored to the topbar with disableable backdrop', () => {
      const open = mockDialogClosed(true);
      const positionStrategy = {} as ReturnType<Overlay['position']>;
      jest.spyOn(spectator.inject(Overlay), 'position').mockReturnValue({
        global: () => ({ top: () => ({ right: () => positionStrategy }) }),
      } as unknown as ReturnType<Overlay['position']>);
      const data = {} as UpdateDialogData;

      spectator.service.update(data);

      expect(open).toHaveBeenCalledWith(UpdateDialog, {
        width: '400px',
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        positionStrategy,
        data,
      });
    });

    it('startService opens StartServiceDialog with disableClose', () => {
      const open = mockDialogClosed(true);

      spectator.service.startService(ServiceName.Cifs).subscribe();

      expect(open).toHaveBeenCalledWith(StartServiceDialog, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
    });

    it('sessionExpiring opens SessionExpiringDialog with disableClose', () => {
      const open = mockDialogClosed(true);
      const options = {} as Parameters<DialogService['sessionExpiring']>[0];

      spectator.service.sessionExpiring(options);

      expect(open).toHaveBeenCalledWith(SessionExpiringDialog, {
        data: options,
        disableClose: true,
      });
    });

    it('showLogs opens ShowLogsDialog with the job as data', () => {
      const open = mockDialogClosed(true);
      const job = { id: 1 } as Job;

      spectator.service.showLogs(job).subscribe();

      expect(open).toHaveBeenCalledWith(ShowLogsDialog, { data: job });
    });

    it('redirect opens RedirectDialog with the redirect data', () => {
      const open = mockDialogClosed(true);
      const data = {} as RedirectDialogData;

      spectator.service.redirect(data).subscribe();

      expect(open).toHaveBeenCalledWith(RedirectDialog, { data });
    });

    it('subsystemPartiallyCreated opens SubsystemPartiallyCreatedDialog with data', () => {
      const open = mockDialogClosed(true);
      const data = {} as SubsystemPartiallyCreatedDialogData;

      spectator.service.subsystemPartiallyCreated(data).subscribe();

      expect(open).toHaveBeenCalledWith(SubsystemPartiallyCreatedDialog, { data });
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
