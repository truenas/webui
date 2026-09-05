import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxDatepickerComponent } from 'app/modules/forms/ix-forms/components/ix-date-picker/ix-date-picker.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { createS3UserPickerProvider } from 'app/pages/sharing/s3/utils/s3-user-picker.utils';

@Component({
  selector: 'ix-s3-access-key-form',
  templateUrl: './s3-access-key-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxUserPickerComponent,
    IxCheckboxComponent,
    IxDatepickerComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class S3AccessKeyFormComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<S3AccessKey | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;
  protected readonly minDateToday = new Date();
  protected readonly userProvider = createS3UserPickerProvider();

  protected readonly existingKey = this.slideInRef.getData();
  protected readonly isNew = !this.existingKey;
  protected readonly isLoading = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    enabled: [true],
    nonExpiring: [true],
    expires_at: [null as Date | null],
  });

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add S3 Access Key')
      : this.translate.instant('Edit S3 Access Key');
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => of(this.form.dirty));
  }

  ngOnInit(): void {
    if (this.existingKey) {
      this.setKeyForEdit(this.existingKey);
    }
  }

  protected onSubmit(): void {
    const {
      name, username, enabled, nonExpiring, expires_at: expiresAtDate,
    } = this.form.getRawValue();
    const expiresAt = (nonExpiring || !expiresAtDate) ? null : { $date: expiresAtDate.getTime() };

    let request$: Observable<S3AccessKey>;
    if (this.existingKey) {
      request$ = this.api.call('s3.accesskey.update', [this.existingKey.id, { name, enabled, expires_at: expiresAt }]);
    } else {
      request$ = this.api.call('s3.accesskey.create', [{
        name, username, enabled, expires_at: expiresAt,
      }]);
    }

    this.isLoading.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (accessKey) => {
        this.isLoading.set(false);
        this.snackbar.success(
          this.isNew
            ? this.translate.instant('S3 access key created')
            : this.translate.instant('S3 access key updated'),
        );
        this.slideInRef.close({ response: true });
        if (this.isNew) {
          this.matDialog.open(S3AccessKeyCredentialsDialogComponent, { data: accessKey });
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private setKeyForEdit(key: S3AccessKey): void {
    this.form.patchValue({
      name: key.name,
      username: key.username ?? '',
      enabled: key.enabled,
      nonExpiring: !key.expires_at?.$date,
      expires_at: key.expires_at?.$date ? new Date(key.expires_at.$date) : null,
    });
    // The account an access key belongs to cannot be changed.
    this.form.controls.username.disable();
  }
}
