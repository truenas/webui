import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { JobProgressDialogRef } from 'app/classes/job-progress-dialog-ref.class';
import {
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
import { InfoDialog } from 'app/modules/dialog/components/info-dialog/info-dialog.component';
import { JobProgressDialog } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import { MultiErrorDialog } from 'app/modules/dialog/components/multi-error-dialog/multi-error-dialog.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(
    private matDialog: MatDialog,
    private translate: TranslateService,
  ) { }

  confirm(confirmOptions: ConfirmOptions): Observable<boolean>;
  confirm(confirmOptions: ConfirmOptionsWithSecondaryCheckbox): Observable<DialogWithSecondaryCheckboxResult>;
  confirm(
    options: ConfirmOptions | ConfirmOptionsWithSecondaryCheckbox,
  ): Observable<boolean> | Observable<DialogWithSecondaryCheckboxResult> {
    return this.matDialog.open(ConfirmDialog, {
      disableClose: options.disableClose || false,
      data: options,
      autoFocus: true,
    })
      .afterClosed();
  }

  error(error: ErrorReport | ErrorReport[]): Observable<boolean> {
    if (Array.isArray(error)) {
      error = this.cleanErrors(error);
      if (error.length > 1) {
        const dialogRef = this.matDialog.open(MultiErrorDialog, {
          data: error,
        });
        return dialogRef.afterClosed();
      }
      error = error[0];
    }
    if (!error?.message) {
      return of(false);
    }
    const dialogRef = this.matDialog.open(ErrorDialog, {
      data: error,
    });
    return dialogRef.afterClosed();
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
    const dialogRef = this.matDialog.open(InfoDialog);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = 'info';
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  warn(title: string, info: string, isHtml = false): Observable<boolean> {
    const dialogRef = this.matDialog.open(InfoDialog);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = 'warning';
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  generalDialog(conf: GeneralDialogConfig): Observable<boolean> {
    const dialogRef = this.matDialog.open(GeneralDialog, {
      data: conf,
    });

    return dialogRef.afterClosed();
  }

  fullScreenDialog(options: Partial<FullScreenDialogOptions> = {}): Observable<void> {
    const dialogRef = this.matDialog.open(FullScreenDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: options,
    });

    return dialogRef.afterClosed();
  }

  closeAllDialogs(): void {
    for (const openDialog of (this.matDialog.openDialogs || [])) {
      openDialog.close();
    }
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
   *    untilDestroyed(this),
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
      title?: string;
      description?: string;

      // Use for long jobs where it's not required for user to wait for the result.
      // Note that `complete` handler will be called immediately and `next` will never be called.
      canMinimize?: boolean;
    } = {},
  ): JobProgressDialogRef<R> {
    const matDialogRef = this.matDialog.open(JobProgressDialog<R>, {
      data: {
        job$,
        title,
        description,
        canMinimize,
      },
    });
    return new JobProgressDialogRef<R>(matDialogRef);
  }
}
