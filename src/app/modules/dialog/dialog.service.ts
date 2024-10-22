import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
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
import { ConfirmDialogComponent } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { FullScreenDialogComponent } from 'app/modules/dialog/components/full-screen-dialog/full-screen-dialog.component';
import { GeneralDialogComponent, GeneralDialogConfig } from 'app/modules/dialog/components/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/dialog/components/info-dialog/info-dialog.component';
import { JobProgressDialogComponent } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import { MultiErrorDialogComponent } from 'app/modules/dialog/components/multi-error-dialog/multi-error-dialog.component';

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
    return this.matDialog.open(ConfirmDialogComponent, {
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
        const dialogRef = this.matDialog.open(MultiErrorDialogComponent, {
          data: error,
        });
        return dialogRef.afterClosed();
      }
      error = error[0];
    }
    if (!error?.message) {
      return of(false);
    }
    const dialogRef = this.matDialog.open(ErrorDialogComponent, {
      data: error,
    });
    dialogRef.componentInstance.title = error.title;
    dialogRef.componentInstance.message = error.message;
    dialogRef.componentInstance.backtrace = error.backtrace;
    if (error.logs) {
      dialogRef.componentInstance.logs = error.logs;
    }
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
    const dialogRef = this.matDialog.open(InfoDialogComponent);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = 'info';
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  warn(title: string, info: string, isHtml = false): Observable<boolean> {
    const dialogRef = this.matDialog.open(InfoDialogComponent);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = 'warning';
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  generalDialog(conf: GeneralDialogConfig, matConfig?: MatDialogConfig): Observable<boolean> {
    const dialogRef = this.matDialog.open(GeneralDialogComponent, matConfig);
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }

  fullScreenDialog(options: Partial<FullScreenDialogOptions> = {}): Observable<void> {
    const dialogRef = this.matDialog.open(FullScreenDialogComponent, {
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
   *   this.ws.call('pool.create', [pool]),
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
    const matDialogRef = this.matDialog.open(JobProgressDialogComponent<R>, {
      data: {
        job$,
        title,
        description,
        canMinimize,
      },
    });
    return new JobProgressDialogRef<R>(matDialogRef, this.translate);
  }
}
