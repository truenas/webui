import {
  ChangeDetectionStrategy, Component, Inject, Optional,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService, DialogService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';

@UntilDestroy()
@Component({
  templateUrl: './create-storj-bucket-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateStorjBucketDialogComponent {
  form = this.formBuilder.group({
    bucket: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CreateStorjBucketDialogComponent>,
    private ws2: WebSocketService2,
    private appLoader: AppLoaderService,
    private dialogService: DialogService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { credentialsId: number },
    private formErrorHandler: FormErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.appLoader.open();
    this.ws2.call('cloudsync.create_bucket', [this.data.credentialsId, this.form.controls.bucket.value]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.appLoader.close();
        this.dialogRef.close(this.form.controls.bucket.value);
      },
      error: (error) => {
        this.appLoader.close();
        this.formErrorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
