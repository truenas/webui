import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input,
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
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { s3UserDirectoryOptions, s3UserFormPreset } from 'app/pages/sharing/s3/utils/s3-user-picker.utils';

@Component({
  selector: 'ix-s3-access-key-form',
  templateUrl: './s3-access-key-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnDateInputComponent,
    IxUserComboboxComponent,
    TranslateModule,
  ],
})
export class S3AccessKeyFormComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  /** Access key being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly accessKey = input<S3AccessKey | undefined>(undefined);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;
  protected readonly minDateToday = new Date();
  protected readonly userDirectoryOptions = s3UserDirectoryOptions;
  protected readonly userFormPreset = s3UserFormPreset;

  protected readonly isNew = computed(() => !this.accessKey());

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    enabled: [true],
    // Off by default: the flag widens what the key may do, and middleware refuses it for an account
    // without SHARING_S3_WRITE, with the error landing on this control.
    manage_buckets: [false],
    // Keys expire unless the admin opts out, so a new key asks for a date up front.
    nonExpiring: [false],
    expires_at: [null as Date | null],
  });

  ngOnInit(): void {
    const accessKey = this.accessKey();
    if (accessKey) {
      this.setKeyForEdit(accessKey);
    }
    this.requireExpiryUnlessNonExpiring();
  }

  /** Unchecking "Non-expiring" is a request for an expiry, so the date becomes mandatory. */
  private requireExpiryUnlessNonExpiring(): void {
    const expiresAt = this.form.controls.expires_at;
    const sync = (nonExpiring: boolean): void => {
      if (nonExpiring) {
        expiresAt.clearValidators();
      } else {
        expiresAt.setValidators(Validators.required);
      }
      expiresAt.updateValueAndValidity();
    };
    sync(this.form.controls.nonExpiring.value);
    this.form.controls.nonExpiring.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sync);
  }

  protected handleSubmit = (): SubmitResult<boolean, S3AccessKey> => {
    const {
      name, username, enabled, manage_buckets: manageBuckets, nonExpiring, expires_at: expiresAtDate,
    } = this.form.getRawValue();
    const expiresAt = (nonExpiring || !expiresAtDate) ? null : { $date: expiresAtDate.getTime() };
    const accessKey = this.accessKey();

    // No `withLoader()`: the panel's own progress bar and disabled Save now cover the save, and a
    // full-screen blocking overlay on top of them was always redundant.
    const request$: Observable<S3AccessKey> = accessKey
      ? this.api.call('s3.accesskey.update', [accessKey.id, {
          name, enabled, expires_at: expiresAt, manage_buckets: manageBuckets,
        }])
      : this.api.call('s3.accesskey.create', [{
          name, username, enabled, expires_at: expiresAt, manage_buckets: manageBuckets,
        }]);

    return {
      request$,
      successMessage: this.isNew()
        ? this.translate.instant('S3 access key created')
        : this.translate.instant('S3 access key updated'),
      // The secret is only ever returned once, so show it before the panel closes.
      onSuccess: (created) => {
        if (this.isNew()) {
          this.tnDialog.open(S3AccessKeyCredentialsDialogComponent, { data: created });
        }
      },
    };
  };

  private setKeyForEdit(key: S3AccessKey): void {
    this.form.patchValue({
      name: key.name,
      username: key.username ?? '',
      enabled: key.enabled,
      manage_buckets: key.manage_buckets,
      nonExpiring: !key.expires_at?.$date,
      expires_at: key.expires_at?.$date ? new Date(key.expires_at.$date) : null,
    });
    // The account an access key belongs to cannot be changed.
    this.form.controls.username.disable();
  }
}
