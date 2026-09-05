import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnDateInputComponent, TnDialog, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnDateInputComponent,
    IxUserPickerComponent,
    TranslateModule,
  ],
})
export class S3AccessKeyFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  /** Access key being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly accessKey = input<S3AccessKey | undefined>(undefined);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;
  protected readonly minDateToday = new Date();
  protected readonly userProvider = createS3UserPickerProvider();

  protected readonly isNew = computed(() => !this.accessKey());
  protected readonly isLoading = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    enabled: [true],
    nonExpiring: [true],
    expires_at: [null as Date | null],
  });

  /** Drives the host-owned Save action (`<tn-side-panel>` footer). */
  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  ngOnInit(): void {
    const accessKey = this.accessKey();
    if (accessKey) {
      this.setKeyForEdit(accessKey);
    }
  }

  protected onSubmit(): void {
    const {
      name, username, enabled, nonExpiring, expires_at: expiresAtDate,
    } = this.form.getRawValue();
    const expiresAt = (nonExpiring || !expiresAtDate) ? null : { $date: expiresAtDate.getTime() };
    const accessKey = this.accessKey();

    let request$: Observable<S3AccessKey>;
    if (accessKey) {
      request$ = this.api.call('s3.accesskey.update', [accessKey.id, { name, enabled, expires_at: expiresAt }]);
    } else {
      request$ = this.api.call('s3.accesskey.create', [{
        name, username, enabled, expires_at: expiresAt,
      }]);
    }

    this.isLoading.set(true);
    request$.pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (created) => {
        this.isLoading.set(false);
        this.snackbar.success(
          this.isNew()
            ? this.translate.instant('S3 access key created')
            : this.translate.instant('S3 access key updated'),
        );
        this.close(true);
        if (this.isNew()) {
          this.tnDialog.open(S3AccessKeyCredentialsDialogComponent, { data: created });
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
        this.loader.close();
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
