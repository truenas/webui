import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, Optional,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export interface SaveConfigDialogMessages {
  title: string;
  message: string;
  warning: string;
  saveButton: string;
  cancelButton: string;
}

@UntilDestroy()
@Component({
  templateUrl: './save-config-dialog.component.html',
  styleUrls: ['./save-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveConfigDialogComponent {
  exportSeedCheckbox = new FormControl(false);

  helptext: SaveConfigDialogMessages;

  readonly defaultMessages: SaveConfigDialogMessages = {
    message: helptext.save_config_form.message,
    title: this.translate.instant('Save Configuration'),
    warning: helptext.save_config_form.warning,
    saveButton: this.translate.instant('Save'),
    cancelButton: this.translate.instant('Cancel'),
  };

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private storage: StorageService,
    private loader: AppLoaderService,
    private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SaveConfigDialogComponent>,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    @Optional() @Inject(MAT_DIALOG_DATA) messageOverrides: Partial<SaveConfigDialogMessages> = {},
  ) {
    this.helptext = {
      ...this.defaultMessages,
      ...messageOverrides,
    };
  }

  onSubmit(): void {
    this.store$.pipe(
      waitForSystemInfo,
      switchMap((systemInfo) => {
        const hostname = systemInfo.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        let fileName = hostname + '-' + systemInfo.version + '-' + date;
        let mimeType: string;

        if (this.exportSeedCheckbox.value) {
          mimeType = 'application/x-tar';
          fileName += '.tar';
        } else {
          mimeType = 'application/x-sqlite3';
          fileName += '.db';
        }

        return this.ws.call('core.download', ['config.save', [{ secretseed: this.exportSeedCheckbox.value }], fileName]).pipe(
          this.loader.withLoader(),
          switchMap(([, url]) => this.storage.downloadUrl(url, fileName, mimeType)),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.dialogRef.close(false);
      },
    });
  }
}
