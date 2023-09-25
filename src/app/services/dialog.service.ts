import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import {
  ConfirmOptions,
  ConfirmOptionsWithSecondaryCheckbox,
  DialogWithSecondaryCheckboxResult,
} from 'app/interfaces/dialog.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { ConfirmDialogComponent } from 'app/modules/common/dialog/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from 'app/modules/common/dialog/error-dialog/error-dialog.component';
import { FullScreenDialogComponent } from 'app/modules/common/dialog/full-screen-dialog/full-screen-dialog.component';
import { GeneralDialogComponent, GeneralDialogConfig } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/common/dialog/info-dialog/info-dialog.component';
import { MultiErrorDialogComponent } from 'app/modules/common/dialog/multi-error-dialog/multi-error-dialog.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DialogService {
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

  error(error: ErrorReport | ErrorReport[]): Observable<boolean> {
    if (Array.isArray(error)) {
      error = this.cleanErrors(error);
      if (error.length > 1) {
        const dialogRef = this.dialog.open(MultiErrorDialogComponent, {
          data: error,
        });
        return dialogRef.afterClosed();
      }
      error = error[0];
    }
    if (!error?.message) {
      return of(false);
    }
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
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

  fullScreenDialog(title: string, message: string, showClose = false): Observable<boolean> {
    const dialogRef = this.dialog.open(FullScreenDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: { showClose },
    });
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;

    return dialogRef.afterClosed();
  }

  closeAllDialogs(): void {
    for (const openDialog of (this.dialog.openDialogs || [])) {
      openDialog.close();
    }
  }
}
