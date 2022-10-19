import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
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
    private mdDialog: MatDialog,
  ) {}

  onSubmit(): void {
    this.loader.open();
    const formData: FormData = new FormData();

    const dialogRef = this.mdDialog.open(EntityJobComponent,
      { data: { title: 'Uploading and Applying Config', closeOnClickOutside: false } });
    dialogRef.componentInstance.setDescription('Uploading and Applying Config');
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', this.form.value.config[0]);
    dialogRef.componentInstance.wspost('config.upload', formData);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });

    // this.fileUpload.onUploaded$
    //   .pipe(untilDestroyed(this))
    //   .subscribe(
    //     () => {
    //       this.loader.close();
    //       this.dialogRef.close();
    //       this.router.navigate(['/others/reboot']);
    //     },
    //   );

    // this.fileUpload.onUploading$
    //   .pipe(untilDestroyed(this))
    //   .subscribe({
    //     error: (error) => {
    //       this.loader.close();
    //       new EntityUtils().handleWsError(this, error, this.dialog);
    //     },
    //   });

    // this.fileUpload.upload(
    //   this.form.value.config[0],
    //   'config.upload',
    // );
  }
}
