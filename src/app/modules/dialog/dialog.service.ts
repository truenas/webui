import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Injectable, Injector, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
import {
  Observable, filter, map, of, switchMap, tap,
} from 'rxjs';
import { JobProgressDialogRef } from 'app/classes/job-progress-dialog-ref.class';
import { ServiceName } from 'app/enums/service-name.enum';
import {
  ConfirmDeleteOptions,
  ConfirmOptions,
  ConfirmOptionsWithSecondaryCheckbox,
  DialogWithSecondaryCheckboxResult, FullScreenDialogOptions,
} from 'app/interfaces/dialog.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { ConfirmDialog } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';
import { ErrorDialog } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { FullScreenDialog } from 'app/modules/dialog/components/full-screen-dialog/full-screen-dialog.component';
import { GeneralDialog, GeneralDialogConfig } from 'app/modules/dialog/components/general-dialog/general-dialog.component';
import { InfoDialog, InfoDialogData } from 'app/modules/dialog/components/info-dialog/info-dialog.component';
import { JobProgressDialog } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import { MultiErrorDialog } from 'app/modules/dialog/components/multi-error-dialog/multi-error-dialog.component';
import { RebootRequiredDialog } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
import { RedirectDialogData } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog-data.interface';
import { RedirectDialog } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog.component';
import {
  SessionExpiringDialog, SessionExpiringDialogOptions,
} from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { ShowLogsDialog } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import {
  StartServiceDialog, StartServiceDialogResult,
} from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import {
  SubsystemPartiallyCreatedDialogComponent, SubsystemPartiallyCreatedDialogData,
} from 'app/modules/dialog/components/subsystem-partially-created-dialog/subsystem-partially-created-dialog.component';
import { UpdateDialog, UpdateDialogData } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { topbarDialogPositionStrategy } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private tnDialog = inject(TnDialog);
  // The cdk `Dialog` is the underlying service `TnDialog` wraps; we inject it
  // directly to access `openDialogs` / `closeAll()` which `TnDialog` does not expose.
  private cdkDialog = inject(Dialog);
  private overlay = inject(Overlay);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private injector = inject(Injector);

  // Lazy to break circular dependency: DialogService → ErrorHandlerService → DialogService.
  // ErrorHandlerService uses the same pattern (see error-handler.service.ts:29-34).
  private _errorHandler: ErrorHandlerService | undefined;
  private get errorHandler(): ErrorHandlerService {
    this._errorHandler ??= this.injector.get(ErrorHandlerService);
    return this._errorHandler;
  }

  /**
   * Confirms deletion, executes the API call or job, handles loading/errors/snackbar.
   * Caller only needs to subscribe and refresh.
   *
   * Usage (simple api.call):
   * ```
   * this.dialogService.confirmDelete({
   *   message: this.translate.instant('Delete "{name}"?', { name: row.name }),
   *   call: () => this.api.call('endpoint.delete', [row.id]),
   *   successMessage: this.translate.instant('Deleted.'),
   * }).pipe(takeUntilDestroyed(this.destroyRef))
   *   .subscribe(() => this.refresh());
   * ```
   *
   * Usage (long-running job):
   * ```
   * this.dialogService.confirmDelete({
   *   message: this.translate.instant('Delete "{name}"?', { name: row.name }),
   *   job: () => this.api.job('endpoint.delete', [row.id]),
   *   jobProgressTitle: this.translate.instant('Deleting...'),
   *   successMessage: this.translate.instant('Deleted.'),
   * }).pipe(takeUntilDestroyed(this.destroyRef))
   *   .subscribe(() => this.refresh());
   * ```
   *
   * Emits once (`void`) on successful deletion.
   * Completes without emitting if the user cancels the confirmation dialog.
   */
  confirmDelete(options: ConfirmDeleteOptions): Observable<void> {
    return this.confirm({
      title: options.title ?? this.translate.instant('Delete'),
      message: options.message,
      buttonText: options.buttonText ?? this.translate.instant('Delete'),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.executeDelete(options)),
      tap(() => {
        if (options.successMessage) {
          this.snackbar.success(options.successMessage);
        }
      }),
      map(() => undefined as void),
    );
  }

  confirm(confirmOptions: ConfirmOptions): Observable<boolean>;
  confirm(confirmOptions: ConfirmOptionsWithSecondaryCheckbox): Observable<DialogWithSecondaryCheckboxResult>;
  confirm(
    options: ConfirmOptions | ConfirmOptionsWithSecondaryCheckbox,
  ): Observable<boolean> | Observable<DialogWithSecondaryCheckboxResult> {
    type ConfirmData = ConfirmOptions | ConfirmOptionsWithSecondaryCheckbox;
    type ConfirmResult = boolean | DialogWithSecondaryCheckboxResult;
    // On dismiss (ESC/backdrop) the cdk dialog emits `undefined`. Normalize it to a
    // fully-shaped "not confirmed" so each overload's return type stays honest:
    // the secondary-checkbox variant must keep the `{ confirmed, secondaryCheckbox }`
    // shape rather than collapsing to a bare `false`.
    const dismissResult: ConfirmResult = 'secondaryCheckbox' in options
      ? { confirmed: false, secondaryCheckbox: false }
      : false;
    return this.tnDialog.open<ConfirmDialog, ConfirmData, ConfirmResult>(ConfirmDialog, {
      disableClose: options.disableClose || false,
      data: options,
      autoFocus: true,
    }).closed.pipe(
      map((result) => result ?? dismissResult),
    ) as Observable<boolean> | Observable<DialogWithSecondaryCheckboxResult>;
  }

  error(error: ErrorReport | ErrorReport[]): Observable<boolean> {
    let report = error;
    if (Array.isArray(report)) {
      const cleaned = this.cleanErrors(report);
      if (cleaned.length > 1) {
        return this.tnDialog.open<MultiErrorDialog, ErrorReport[], boolean>(MultiErrorDialog, {
          data: cleaned,
        }).closed.pipe(map((result) => result ?? false));
      }
      report = cleaned[0];
    }
    if (!report?.message) {
      return of(false);
    }
    return this.tnDialog.open<ErrorDialog, ErrorReport, boolean>(ErrorDialog, {
      data: report,
    }).closed.pipe(map((result) => result ?? false));
  }

  private cleanErrors(errorReports: ErrorReport[]): ErrorReport[] {
    const newErrorReports = [];
    for (const errorReport of errorReports) {
      if (errorReport.message) {
        newErrorReports.push({ ...errorReport });
      }
    }
    return newErrorReports;
  }

  info(title: string, info: string, isHtml = false): Observable<boolean> {
    return this.tnDialog.open<InfoDialog, InfoDialogData, boolean>(InfoDialog, {
      data: {
        title,
        info,
        icon: 'information',
        isHtml,
      },
    }).closed.pipe(map((result) => result ?? false));
  }

  warn(title: string, info: string, isHtml = false): Observable<boolean> {
    return this.tnDialog.open<InfoDialog, InfoDialogData, boolean>(InfoDialog, {
      data: {
        title,
        info,
        icon: 'alert',
        isHtml,
      },
    }).closed.pipe(map((result) => result ?? false));
  }

  generalDialog(conf: GeneralDialogConfig): Observable<boolean> {
    return this.tnDialog.open<GeneralDialog, GeneralDialogConfig, boolean>(GeneralDialog, {
      data: conf,
    }).closed.pipe(map((result) => result ?? false));
  }

  fullScreenDialog(options: Partial<FullScreenDialogOptions> = {}): Observable<void> {
    return this.tnDialog.openFullscreen<FullScreenDialog, Partial<FullScreenDialogOptions>, void>(FullScreenDialog, {
      disableClose: true,
      data: options,
    }).closed as Observable<void>;
  }

  closeAllDialogs(): void {
    this.cdkDialog.closeAll();
  }

  /** Re-exposed for callers that need to react to dialog open events (e.g. inactivity tracking). */
  get afterOpened$(): Observable<DialogRef> {
    return this.cdkDialog.afterOpened.asObservable();
  }

  rebootRequired(): Observable<boolean | undefined> {
    return this.tnDialog.open<RebootRequiredDialog, void, boolean>(RebootRequiredDialog, {
      minWidth: '400px',
    }).closed;
  }

  /**
   * Opens the topbar update dialog. Returns the ref so the caller can `.close()` it
   * across the update lifecycle (e.g. when the update job completes or fails).
   * The dialog is anchored to the top-right of the screen below the topbar.
   */
  update(data: UpdateDialogData): DialogRef<unknown, UpdateDialog> {
    const positionStrategy = topbarDialogPositionStrategy(this.overlay);
    return this.tnDialog.open<UpdateDialog, UpdateDialogData>(UpdateDialog, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      positionStrategy,
      data,
    });
  }

  showLogs(job: Job): Observable<void | undefined> {
    return this.tnDialog.open<ShowLogsDialog, Job, void>(ShowLogsDialog, {
      data: job,
    }).closed;
  }

  startService(serviceName: ServiceName): Observable<StartServiceDialogResult | undefined> {
    return this.tnDialog.open<StartServiceDialog, ServiceName, StartServiceDialogResult>(StartServiceDialog, {
      data: serviceName,
      disableClose: true,
    }).closed;
  }

  redirect(data: RedirectDialogData): Observable<boolean | undefined> {
    return this.tnDialog.open<RedirectDialog, RedirectDialogData, boolean>(RedirectDialog, {
      data,
    }).closed;
  }

  /**
   * Opens the session-expiring warning dialog. Returns the ref so the caller can
   * `.close()` it if user activity is detected before the warning is acted on.
   */
  sessionExpiring(opts: SessionExpiringDialogOptions): DialogRef<boolean, SessionExpiringDialog> {
    return this.tnDialog.open<SessionExpiringDialog, SessionExpiringDialogOptions, boolean>(SessionExpiringDialog, {
      data: opts,
      disableClose: true,
    });
  }

  subsystemPartiallyCreated(data: SubsystemPartiallyCreatedDialogData): Observable<void | undefined> {
    return this.tnDialog.open<SubsystemPartiallyCreatedDialogComponent, SubsystemPartiallyCreatedDialogData, void>(
      SubsystemPartiallyCreatedDialogComponent,
      { data },
    ).closed;
  }

  private executeDelete(options: ConfirmDeleteOptions): Observable<unknown> {
    if ('job' in options) {
      return this.jobDialog(options.job(), {
        title: options.jobProgressTitle ?? this.translate.instant('Deleting...'),
      }).afterClosed().pipe(
        this.errorHandler.withErrorHandler(),
      );
    }
    return options.call().pipe(
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
    );
  }

  /**
   * Usage:
   * ```
   * this.dialogService.jobDialog(
   *   this.api.call('pool.create', [pool]),
   * )
   *  .afterClosed()
   *  .pipe(
   *    this.errorHandler.catchError(),
   *    takeUntilDestroyed(this.destroyRef),
   *  )
   *  .subscribe(() => {
   *    // Job completed.
   *  });
   * ```
   *
   * If you need more control over JobProgressDialogComponent, use it directly.
   */
  jobDialog<R>(
    job$: Observable<Job<R>>,
    { title, description, canMinimize }: {
      title?: TranslatedString;
      description?: TranslatedString;

      // Use for long jobs where it's not required for user to wait for the result.
      // Note that `complete` handler will be called immediately and `next` will never be called.
      canMinimize?: boolean;
    } = {},
  ): JobProgressDialogRef<R> {
    const dialogRef = this.tnDialog.open<JobProgressDialog<R>, unknown, void>(JobProgressDialog<R>, {
      data: {
        job$,
        title,
        description,
        canMinimize,
      },
    });
    return new JobProgressDialogRef<R>(dialogRef);
  }
}
