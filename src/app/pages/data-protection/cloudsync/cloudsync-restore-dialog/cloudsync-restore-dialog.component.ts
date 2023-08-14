import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mntPath } from 'app/enums/mnt-path.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext_cloudsync from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import { CloudsyncRestoreParams } from 'app/interfaces/cloudsync-provider.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-restore-dialog.component.html',
  styleUrls: ['./cloudsync-restore-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudsyncRestoreDialogComponent {
  readonly form = this.formBuilder.group({
    description: ['', Validators.required],
    transfer_mode: [TransferMode.Copy],
    path: [mntPath, Validators.required],
  });

  readonly treeNodeProvider = this.filesystem.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly helptext = helptext_cloudsync;
  readonly transferModes$ = of([
    {
      value: TransferMode.Sync,
      label: this.translate.instant('SYNC'),
    },
    {
      value: TransferMode.Copy,
      label: this.translate.instant('COPY'),
    },
  ]);

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private filesystem: FilesystemService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<CloudsyncRestoreDialogComponent>,
    private errorHandler: FormErrorHandlerService,
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) private parentTaskId: number,
  ) { }

  onSubmit(): void {
    this.ws.call('cloudsync.restore', [this.parentTaskId, this.form.value] as CloudsyncRestoreParams)
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.dialogRef.close();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
