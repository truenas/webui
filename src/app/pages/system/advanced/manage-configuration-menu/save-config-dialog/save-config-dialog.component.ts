import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
export class SaveConfigDialog {
  private store$ = inject<Store<AppState>>(Store);
  private download = inject(DownloadService);
  private loader = inject(LoaderService);
  private datePipe = inject(DatePipe);
  private dialogRef = inject<MatDialogRef<SaveConfigDialog>>(MatDialogRef);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  protected readonly requiredRoles = [Role.FullAdmin];

  exportSeedCheckbox = new FormControl(true);

  helptext: SaveConfigDialogMessages;

  readonly defaultMessages: SaveConfigDialogMessages = {
    message: helptext.saveConfigForm.message,
    title: this.translate.instant('Save Configuration'),
    warning: helptext.saveConfigForm.warning,
    saveButton: this.translate.instant('Save'),
    cancelButton: this.translate.instant('Cancel'),
  };

  constructor() {
    const messageOverrides = inject<Partial<SaveConfigDialogMessages>>(MAT_DIALOG_DATA, { optional: true }) ?? {};

    this.helptext = {
      ...this.defaultMessages,
      ...messageOverrides,
    };
  }

  onSubmit(): void {
    this.store$.pipe(
      waitForSystemInfo,
      this.loader.withLoader(),
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

        return this.download.coreDownload({
          fileName,
          mimeType,
          method: 'config.save',
          arguments: [{ secretseed: this.exportSeedCheckbox.value }],
        });
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.dialogRef.close(false);
      },
    });
  }
}
