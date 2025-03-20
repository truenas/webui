import {
  ChangeDetectionStrategy, Component, OnInit, output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UploadService } from 'app/services/upload.service';

@UntilDestroy()
@Component({
  selector: 'ix-upload-iso',
  styleUrls: ['./upload-iso-button.component.scss'],
  templateUrl: './upload-iso-button.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFileInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    RequiresRolesDirective,
    IxIconComponent,
  ],
})
export class UploadIsoButtonComponent implements OnInit {
  readonly uploaded = output();

  protected readonly imageFileControl = new FormControl<File[]>([]);
  protected readonly requiredRoles = [Role.VirtImageWrite];

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private uploadService: UploadService,
    private snackbar: SnackbarService,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.imageFileControl.valueChanges
      .pipe(
        filter((files) => !!files.length),
        switchMap(() => this.api.call('virt.volume.query')),
        map((volumes) => volumes.map((volume) => volume.name)),
        untilDestroyed(this),
      )
      .subscribe((existingNames) => this.uploadImage(existingNames));
  }

  private uploadImage(existingNames: string[]): void {
    const file = this.imageFileControl.value[0];
    this.imageFileControl.setValue([]);
    const job$ = this.uploadService.uploadAsJob({
      file,
      method: 'virt.volume.import_iso',
      params: [{
        name: file.name,
        upload_iso: true,
      }],
    });

    if (existingNames.includes(file.name)) {
      this.dialogService.error({
        title: this.translate.instant('Error'),
        message: this.translate.instant('Volume with this name already exists.'),
      });
      return;
    }

    this.dialogService
      .jobDialog(job$, { title: this.translate.instant('Uploading Image') })
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Image uploaded successfully'));
        this.uploaded.emit();
      });
  }
}
