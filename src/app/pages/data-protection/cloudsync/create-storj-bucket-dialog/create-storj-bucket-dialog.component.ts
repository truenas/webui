import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, Inject, Optional,
} from '@angular/core';
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
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-create-storj-bucket-dialog',
  templateUrl: './create-storj-bucket-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    CdkScrollable,
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
export class CreateStorjBucketDialogComponent {
  protected readonly requiredRoles = [Role.FullAdmin];

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
