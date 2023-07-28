import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { mntPath } from 'app/enums/mnt-path.enum';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';

@UntilDestroy()
@Component({
  templateUrl: './upload-iso-dialog.component.html',
  styleUrls: ['./upload-iso-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadIsoDialogComponent {
  form = this.formBuilder.group({
    path: [mntPath],
    files: [[] as File[]],
  });

  readonly directoryNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private filesystemService: FilesystemService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<UploadIsoDialogComponent, string | null>,
    private uploadService: IxFileUploadService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const { path, files } = this.form.value;
    const file = files[0];
    const uploadPath = `${path}/${file.name}`;

    this.loader.open();
    this.uploadService.onUploading$.pipe(untilDestroyed(this)).subscribe({
      next: (event) => {
        const percentDone = Math.round(100 * event.loaded / event.total);
        this.loader.setTitle(
          this.translate.instant('{n}% Uploaded', { n: percentDone }),
        );
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
    this.uploadService.onUploaded$.pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.dialogRef.close(uploadPath);
    });
    this.uploadService.upload(file, 'filesystem.put', [uploadPath, { mode: 493 }]);
  }
}
