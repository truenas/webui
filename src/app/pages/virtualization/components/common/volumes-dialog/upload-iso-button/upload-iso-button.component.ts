import {
  ChangeDetectionStrategy, Component, OnInit, output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UploadService } from 'app/services/upload.service';

@UntilDestroy()
@Component({
  selector: 'ix-upload-iso',
  templateUrl: './upload-iso-button.component.html',
  styleUrls: ['./upload-iso.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFileInputComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class UploadIsoButtonComponent implements OnInit {
  readonly uploaded = output();

  protected readonly imageFileControl = new FormControl<File[]>([]);

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private uploadService: UploadService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.imageFileControl.valueChanges
      .pipe(
        filter((files) => !!files.length),
        untilDestroyed(this),
      )
      .subscribe(() => this.uploadImage());
  }

  private uploadImage(): void {
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
