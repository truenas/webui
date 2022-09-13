import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ConfirmDialogComponent } from 'app/modules/common/dialog/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from 'app/modules/common/dialog/error-dialog/error-dialog.component';
import { GeneralDialogComponent, GeneralDialogConfig } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/common/dialog/info-dialog/info-dialog.component';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  protected loaderOpen = false;

  constructor(private dialog: MatDialog, private ws: WebSocketService) {
    /* Close all open dialogs when websocket connection is dropped */
    this.ws.onCloseSubject$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.closeAllDialogs());
  }

  confirm(confirmOptions: ConfirmOptions): Observable<boolean>;
  /**
   * @deprecated Use dialogForm or build a separate dialog component
   */
  confirm(confirmOptions: ConfirmOptionsWithSecondaryCheckbox): MatDialogRef<ConfirmDialogComponent, unknown>;
  confirm(
    options: ConfirmOptions | ConfirmOptionsWithSecondaryCheckbox,
  ): Observable<boolean> | MatDialogRef<ConfirmDialogComponent, unknown> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { disableClose: options.disableClose || false });

    dialogRef.componentInstance.title = options.title;
    dialogRef.componentInstance.message = options.message;

    if (options.buttonMsg) {
      dialogRef.componentInstance.buttonMsg = options.buttonMsg;
    }

    if (options.hideCheckBox) {
      dialogRef.componentInstance.hideCheckBox = options.hideCheckBox;
    }

    if (options.tooltip) {
      dialogRef.componentInstance.tooltip = options.tooltip;
    }

    if (options.hideCancel) {
      dialogRef.componentInstance.hideCancel = options.hideCancel;
      dialogRef.disableClose = options.hideCancel;
    }
    if (options.cancelMsg) {
      dialogRef.componentInstance.cancelMsg = options.cancelMsg;
    }

    if ('secondaryCheckBox' in options && options.secondaryCheckBox) {
      dialogRef.componentInstance.secondaryCheckBox = options.secondaryCheckBox;
      dialogRef.componentInstance.secondaryCheckBoxMsg = options.secondaryCheckBoxMsg;
      dialogRef.componentInstance.data = options.data;
      dialogRef.componentInstance.method = options.method;
      dialogRef.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe((selection: boolean) => {
        const data = options.data;
        // TODO: Does not belong to dialog.service in any form or shape.
        if (selection && data && data[0]) {
          if (data[0] && data[0].hasOwnProperty('reboot')) {
            data[0].reboot = !data[0].reboot;
          }
          if (data[0] && data[0].hasOwnProperty('overcommit')) {
            data[0].overcommit = !data[0].overcommit;
          }
          if (data[0] && data[0].hasOwnProperty('delete_unused_images')) {
            data[0].delete_unused_images = !data[0].delete_unused_images;
          }
          dialogRef.componentInstance.data = data;
          return dialogRef;
        }
      });
      return dialogRef;
    }
    return dialogRef.afterClosed();
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

  dialogForm(conf: DialogFormConfiguration, disableClose = false): Observable<boolean> {
    const dialogRef = this.dialog.open(EntityDialogComponent, { maxWidth: '420px', minWidth: '350px', disableClose });
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }

  dialogFormWide(conf: DialogFormConfiguration): Observable<boolean> {
    const dialogRef = this.dialog.open(EntityDialogComponent, { width: '550px', disableClose: true });
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }

  closeAllDialogs(): void {
    for (const openDialog of this.dialog.openDialogs) {
      openDialog.close();
    }
  }

  generalDialog(conf: GeneralDialogConfig, matConfig?: MatDialogConfig): Observable<boolean> {
    const dialogRef = this.dialog.open(GeneralDialogComponent, matConfig);
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }
}
