import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, Optional,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
  selector: 'ix-save-config-dialog',
  templateUrl: './save-config-dialog.component.html',
  styleUrls: ['./save-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    FormsModule,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
  providers: [
    DatePipe,
  ],
})
export class SaveConfigDialogComponent {
  readonly requiredRoles = [Role.FullAdmin];

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
    private download: DownloadService,
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
          switchMap(([, url]) => this.download.downloadUrl(url, fileName, mimeType)),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.dialogRef.close(false);
      },
    });
  }
}
