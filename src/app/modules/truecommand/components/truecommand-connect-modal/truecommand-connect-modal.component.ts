import {
  ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/topbar';
import { TrueCommandConfig, UpdateTrueCommand } from 'app/interfaces/true-command-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface TruecommandSignupModalState {
  isConnected: boolean;
  config: TrueCommandConfig;
}

export type TruecommandSignupModalResult = boolean | { deregistered: boolean };

@UntilDestroy()
@Component({
  styleUrls: ['./truecommand-connect-modal.component.scss'],
  templateUrl: './truecommand-connect-modal.component.html',
})
export class TruecommandConnectModalComponent implements OnInit {
  readonly helptext = helptext;

  title: string;
  saveButtonText: string;

  form = this.fb.group({
    api_key: [''],
    enabled: [true],
  });

  get isConnected(): boolean { return this.data?.isConnected; }

  constructor(
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private data: TruecommandSignupModalState,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<TruecommandConnectModalComponent, TruecommandSignupModalResult>,
    private fb: FormBuilder,
    private loader: AppLoaderService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.title = this.data.isConnected ? helptext.updateDialog.title_update : helptext.updateDialog.title_connect;
    this.saveButtonText = this.data.isConnected ? helptext.updateDialog.save_btn : helptext.updateDialog.connect_btn;

    if (this.data.isConnected) {
      this.form.patchValue(this.data.config);
      this.cdr.markForCheck();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    this.loader.open();

    const params = {} as UpdateTrueCommand;

    params.enabled = this.form.value.enabled;
    if (this.form.value.api_key) {
      params.api_key = this.form.value.api_key;
    }

    this.ws.call('truecommand.update', [params]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.dialogRef.close();

        if (!this.isConnected) {
          this.dialogService.info(helptext.checkEmailInfoDialog.title, helptext.checkEmailInfoDialog.message);
        }
      },
      error: (err: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(err));
      },
    });
  }

  onDeregister(): void {
    this.dialogService.generalDialog({
      title: helptext.tcDeregisterDialog.title,
      icon: helptext.tcDeregisterDialog.icon,
      message: helptext.tcDeregisterDialog.message,
      confirmBtnMsg: helptext.tcDeregisterDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.loader.open();
      this.ws.call('truecommand.update', [{ api_key: null, enabled: false }])
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => {
            this.loader.close();
            this.dialogRef.close({ deregistered: true });
            this.dialogService.generalDialog({
              title: helptext.deregisterInfoDialog.title,
              message: helptext.deregisterInfoDialog.message,
              hideCancel: true,
            });
          },
          error: (err: WebsocketError) => {
            this.loader.close();
            this.dialogService.error(this.errorHandler.parseWsError(err));
          },
        });
    });
  }
}
