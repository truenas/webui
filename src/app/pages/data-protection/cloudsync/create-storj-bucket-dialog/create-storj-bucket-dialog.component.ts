import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-create-storj-bucket-dialog',
  templateUrl: './create-storj-bucket-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    MatDialogContent,
    IxInputComponent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CreateStorjBucketDialog {
  private formBuilder = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<CreateStorjBucketDialog>>(MatDialogRef);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  data = inject<{
    credentialsId: number;
  }>(MAT_DIALOG_DATA, { optional: true });

  private formErrorHandler = inject(FormErrorHandlerService);

  protected readonly requiredRoles = [Role.CloudSyncWrite];

  form = this.formBuilder.group({
    bucket: ['', Validators.required],
  });

  onSubmit(): void {
    this.api.call('cloudsync.create_bucket', [this.data.credentialsId, this.form.controls.bucket.value])
      .pipe(
        this.loader.withLoader(),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(this.form.controls.bucket.value);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
