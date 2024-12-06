import { HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  catchError, of, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

@UntilDestroy()
@Component({
  selector: 'ix-upload-iso-dialog',
  templateUrl: './upload-iso-dialog.component.html',
  styleUrls: ['./upload-iso-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxFileInputComponent,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class UploadIsoDialogComponent {
  form = this.formBuilder.group({
    path: [mntPath],
    files: [[] as File[]],
  });

  readonly directoryNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly helptext = helptextVmWizard;
  protected readonly requiredRoles = [Role.VmWrite];

  constructor(
    private formBuilder: FormBuilder,
    private filesystemService: FilesystemService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<UploadIsoDialogComponent, string | null>,
    private uploadService: UploadService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const { path, files } = this.form.value;
    const file = files[0];
    const uploadPath = `${path}/${file.name}`;

    this.loader.open();

    this.uploadService.upload({
      file,
      method: 'filesystem.put',
      params: [uploadPath, { mode: 493 }],
    })
      .pipe(
        tap((event: HttpProgressEvent) => {
          if (event instanceof HttpResponse) {
            this.loader.close();
            this.dialogRef.close(uploadPath);
          }

          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = Math.round(100 * event.loaded / event.total);
            this.loader.setTitle(
              this.translate.instant('{n}% Uploaded', { n: percentDone }),
            );
          }
        }),
        catchError((error: unknown) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseError(error));
          return of(error);
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
