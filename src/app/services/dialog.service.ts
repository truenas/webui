import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { ConfirmDialogComponent } from 'app/pages/common/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from 'app/pages/common/error-dialog/error-dialog.component';
import { GeneralDialogComponent, GeneralDialogConfig } from 'app/pages/common/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/pages/common/info-dialog/info-dialog.component';
import { SelectDialogComponent } from 'app/pages/common/select-dialog/select-dialog.component';
import { AppLoaderService } from '../modules/app-loader/app-loader.service';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable()
export class DialogService {
  protected loaderOpen = false;

  constructor(private dialog: MatDialog, private ws: WebSocketService, protected loader: AppLoaderService) {
    /* Close all open dialogs when websocket connection is dropped */
    this.ws.onCloseSubject$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.closeAllDialogs());
  }

  confirm(confirmOptions: ConfirmOptions): Observable<boolean>;
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

    if (options.textToCopy) {
      dialogRef.componentInstance.keyTextArea = options.keyTextArea;
    }

    if (options.keyTextArea) {
      dialogRef.componentInstance.textToCopy = options.textToCopy;
    }

    if ('secondaryCheckBox' in options && options.secondaryCheckBox) {
      dialogRef.componentInstance.secondaryCheckBox = options.secondaryCheckBox;
      dialogRef.componentInstance.secondaryCheckBoxMsg = options.secondaryCheckBoxMsg;
      dialogRef.componentInstance.data = options.data;
      dialogRef.componentInstance.method = options.method;
      dialogRef.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe((selection: boolean) => {
        const data = options.data;
        if (selection) {
          if (data[0] && data[0].hasOwnProperty('reboot')) {
            data[0].reboot = !data[0].reboot;
          }
          if (data[0] && data[0].hasOwnProperty('overcommit')) {
            data[0].overcommit = !data[0].overcommit;
          }
          dialogRef.componentInstance.data = data;
          return dialogRef;
        }
      });
      return dialogRef;
    }
    return dialogRef.afterClosed();
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

  info(title: string, info: string, width = '500px', icon = 'report_problem', isHtml = false): Observable<boolean> {
    const dialogRef = this.dialog.open(InfoDialogComponent, { width });

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.info = info;
    dialogRef.componentInstance.icon = icon;
    dialogRef.componentInstance.isHtml = isHtml;

    return dialogRef.afterClosed();
  }

  /**
   * @deprecated
   */
  select(
    title: string,
    options: Option[],
    optionPlaceHolder: string,
  ): MatDialogRef<SelectDialogComponent> {
    const dialogRef = this.dialog.open(SelectDialogComponent, { width: '300px' });

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.options = options;
    dialogRef.componentInstance.optionPlaceHolder = optionPlaceHolder;
    return dialogRef;
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

  doubleConfirm(
    title: string,
    message: string,
    name: string,
    confirmBox?: boolean,
    buttonMsg?: string,
  ): Observable<boolean> {
    const conf = {
      title,
      message,
      name,
      confirmInstructions: true,
      fieldConfig: [
        {
          type: 'input',
          name: 'name',
          required: true,
          hideErrMsg: true,
        },
        {
          type: 'checkbox',
          name: 'confirm',
          placeholder: T('Confirm'),
          isHidden: !confirmBox,
        },
      ],
      saveButtonText: buttonMsg || T('DELETE'),
      afterInit(entityDialog: EntityDialogComponent) {
        entityDialog.formGroup.controls['name'].valueChanges.pipe(untilDestroyed(entityDialog)).subscribe((res) => {
          entityDialog.submitEnabled = res === name && (confirmBox ? entityDialog.formGroup.controls['confirm'].value : true);
        });
        entityDialog.formGroup.controls['confirm'].valueChanges.pipe(untilDestroyed(entityDialog)).subscribe((res) => {
          entityDialog.submitEnabled = res && (entityDialog.formGroup.controls['name'].value === name);
        });
      },
      customSubmit(entityDialog: EntityDialogComponent) {
        entityDialog.dialogRef.close(true);
      },
    } as DialogFormConfiguration;
    return this.dialogForm(conf);
  }

  closeAllDialogs(): void {
    for (const openDialog of this.dialog.openDialogs) {
      openDialog.close();
    }
  }

  generalDialog(conf: GeneralDialogConfig, matConfig?: MatDialogConfig): Observable<any> {
    const dialogRef = this.dialog.open(GeneralDialogComponent, matConfig);
    dialogRef.componentInstance.conf = conf;

    return dialogRef.afterClosed();
  }
}
