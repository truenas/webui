import {
  ChangeDetectionStrategy, Component, Inject, Optional,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './create-storj-bucket-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateStorjBucketDialogComponent {
  protected requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    bucket: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CreateStorjBucketDialogComponent>,
    private ws: WebSocketService,
    private appLoader: AppLoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { credentialsId: number },
    private formErrorHandler: FormErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.ws.call('cloudsync.create_bucket', [this.data.credentialsId, this.form.controls.bucket.value])
      .pipe(
        this.appLoader.withLoader(),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(this.form.controls.bucket.value);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
