import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import {
  ConfirmOptions,
  ConfirmOptionsWithSecondaryCheckbox,
  DialogWithSecondaryCheckboxResult,
} from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ConfirmDialogComponent } from 'app/modules/common/dialog/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from 'app/modules/common/dialog/error-dialog/error-dialog.component';
import { GeneralDialogComponent, GeneralDialogConfig } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/common/dialog/info-dialog/info-dialog.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  protected loaderOpen = false;

  constructor(private dialog: MatDialog) { }

  confirm(confirmOptions: ConfirmOptions): Observable<boolean>;
  confirm(confirmOptions: ConfirmOptionsWithSecondaryCheckbox): Observable<DialogWithSecondaryCheckboxResult>;
  confirm(
    options: ConfirmOptions | ConfirmOptionsWithSecondaryCheckbox,
  ): Observable<boolean> | Observable<DialogWithSecondaryCheckboxResult> {
    return this.dialog.open(ConfirmDialogComponent, {
      disableClose: options.disableClose || false,
      data: options,
    })
      .afterClosed();
  }

  errorReportMiddleware(error: WebsocketError | Job): void {
    if ('trace' in error && error.trace.formatted) {
      this.errorReport(error.trace.class, error.reason, error.trace.formatted);
    } else if ('state' in error && error.error && error.exception) {
      this.errorReport(error.state, error.error, error.exception);
    } else {
      // if it can't print the error at least put it on the console.
      console.error(error);
    }
  }

  errorReport(title: string, message: string, backtrace = '', logs?: Job): Observable<boolean> {
    const dialogRef = this.dialog.open(ErrorDialogComponent);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.backtrace = backtrace;
    if (logs) {
      dialogRef.componentInstance.logs = logs;
    }

    return dialogRef.afterClosed();
  }

  info(title: string, info: string, isHtml = false): Observable<boolean> {
    const dialogRef = this.dialog.open(InfoDialogComponent);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = 'info';
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  warn(title: string, info: string, isHtml = false): Observable<boolean> {
    const dialogRef = this.dialog.open(InfoDialogComponent);

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = 'warning';
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  generalDialog(conf: GeneralDialogConfig, matConfig?: MatDialogConfig): Observable<boolean> {
    const dialogRef = this.dialog.open(GeneralDialogComponent, matConfig);
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }

  closeAllDialogs(): void {
    for (const openDialog of this.dialog.openDialogs) {
      openDialog.close();
    }
  }
}
