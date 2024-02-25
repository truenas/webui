import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig, UpdateTrueCommand } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruecommandConnectModalComponent implements OnInit {
  readonly helptext = helptextTopbar;
  protected readonly requiredRoles = [Role.TrueCommandWrite];

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
    this.title = this.data.isConnected
      ? helptextTopbar.updateDialog.title_update
      : helptextTopbar.updateDialog.title_connect;
    this.saveButtonText = this.data.isConnected
      ? helptextTopbar.updateDialog.save_btn
      : helptextTopbar.updateDialog.connect_btn;

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
          this.dialogService.info(
            helptextTopbar.checkEmailInfoDialog.title,
            helptextTopbar.checkEmailInfoDialog.message,
          );
        }
      },
      error: (err: unknown) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  onDeregister(): void {
    this.dialogService.generalDialog({
      title: helptextTopbar.tcDeregisterDialog.title,
      icon: helptextTopbar.tcDeregisterDialog.icon,
      message: helptextTopbar.tcDeregisterDialog.message,
      confirmBtnMsg: helptextTopbar.tcDeregisterDialog.confirmBtnMsg,
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
              title: helptextTopbar.deregisterInfoDialog.title,
              message: helptextTopbar.deregisterInfoDialog.message,
              hideCancel: true,
            });
          },
          error: (err: unknown) => {
            this.loader.close();
            this.dialogService.error(this.errorHandler.parseError(err));
          },
        });
    });
  }
}
