import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService, DialogService } from 'app/services';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';

@UntilDestroy()
@Component({
  templateUrl: './upload-config-dialog.component.html',
  styleUrls: ['./upload-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadConfigDialogComponent {
  form = this.formBuilder.group({
    config: [null as File[], Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private loader: AppLoaderService,
    private fileUpload: IxFileUploadService,
    private dialog: DialogService,
    private dialogRef: MatDialogRef<UploadConfigDialogComponent>,
  ) {}

  onSubmit(): void {
    this.loader.open();

    this.fileUpload.onUploaded$
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loader.close();
          this.dialogRef.close();
          this.router.navigate(['/others/reboot']);
        },
      );

    this.fileUpload.onUploading$
      .pipe(untilDestroyed(this))
      .subscribe({
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialog);
        },
      });

    this.fileUpload.upload(
      this.form.value.config[0],
      'config.upload',
    );
  }
}
