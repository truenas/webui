import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Role } from 'app/enums/role.enum';
import { combineLatestIsAny } from 'app/helpers/operators/combine-latest-is-any.helper';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DatasetChangeKeyParams } from 'app/interfaces/dataset-change-key.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { isPasswordEncrypted, isEncryptionRoot } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { EncryptionOptionsDialogData } from './encryption-options-dialog-data.interface';

enum EncryptionType {
  Key = 'key',
  Passphrase = 'passphrase',
}

@UntilDestroy({
  arrayName: 'subscriptions',
})
@Component({
  selector: 'ix-encryption-options-dialog',
  templateUrl: './encryption-options-dialog.component.html',
  styleUrls: ['./encryption-options-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxSelectComponent,
    IxTextareaComponent,
    IxInputComponent,
    AsyncPipe,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
  ],
})
export class EncryptionOptionsDialogComponent implements OnInit {
  form = this.fb.group({
    inherit_encryption: [false],
    encryption_type: [null as EncryptionType],
    generate_key: [false],
    key: ['', [Validators.required, Validators.minLength(64), Validators.maxLength(64)]],
    passphrase: ['', Validators.minLength(8)],
    confirm_passphrase: [''],
    pbkdf2iters: [350000, Validators.min(100000)],
    algorithm: [''],
    confirm: [false, [Validators.requiredTrue]],
  }, {
    validators: [
      matchOthersFgValidator(
        'confirm_passphrase',
        ['passphrase'],
        this.translate.instant('Passphrase and confirmation should match.'),
      ),
    ],
  });

  subscriptions: Subscription[] = [];

  isInheriting$ = this.form.select((values) => values.inherit_encryption);
  isKey$ = this.form.select((values) => values.encryption_type === EncryptionType.Key);
  isSetToGenerateKey$ = this.form.select((values) => values.generate_key);

  readonly tooltips = {
    encryption_type: helptextDatasetForm.dataset_form_encryption.encryption_type_tooltip,
    generate_key: helptextDatasetForm.dataset_form_encryption.generate_key_checkbox_tooltip,
    key: helptextDatasetForm.dataset_form_encryption.key_tooltip,
    passphrase: helptextDatasetForm.dataset_form_encryption.passphrase_tooltip,
    pbkdf2iters: helptextDatasetForm.dataset_form_encryption.pbkdf2iters_tooltip,
  };

  readonly encryptionTypeOptions$ = of(helptextDatasetForm.dataset_form_encryption.encryption_type_options);

  protected readonly Role = Role;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private dialog: DialogService,
    private dialogRef: MatDialogRef<EncryptionOptionsDialogComponent>,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: EncryptionOptionsDialogData,
  ) {}

  get canInherit(): boolean {
    return this.data.parent?.encrypted;
  }

  get hasPassphraseParent(): boolean {
    return this.data.parent?.key_format?.value === EncryptionKeyFormat.Passphrase;
  }

  get hasKeyChild(): boolean {
    const keyChild = findInTree(
      this.data.dataset.children,
      (dataset) => isEncryptionRoot(dataset) && !isPasswordEncrypted(dataset),
    );

    return Boolean(keyChild);
  }

  ngOnInit(): void {
    this.loadPbkdf2iters();
    this.setFormValues();
    this.setControlDependencies();
  }

  onSubmit(): void {
    if (this.form.value.inherit_encryption) {
      // Only try to change to inherit if not currently inheriting
      if (!isEncryptionRoot(this.data.dataset)) {
        this.dialogRef.close(false);
        return;
      }

      this.setToInherit();
    } else {
      this.saveForm();
    }
  }

  private setToInherit(): void {
    this.api.call('pool.dataset.inherit_parent_encryption_properties', [this.data.dataset.id])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.showSuccessMessage();
          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private saveForm(): void {
    const values = this.form.getRawValue();

    const body = {} as DatasetChangeKeyParams;
    if (values.encryption_type === EncryptionType.Key) {
      body.generate_key = values.generate_key;
      if (!values.generate_key) {
        body.key = values.key;
      }
    } else {
      body.passphrase = values.passphrase;
      body.pbkdf2iters = Number(values.pbkdf2iters);
    }

    this.dialog.jobDialog(
      this.api.job('pool.dataset.change_key', [this.data.dataset.id, body]),
      { title: this.translate.instant('Updating key type') },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.showSuccessMessage();
          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private showSuccessMessage(): void {
    this.snackbar.success(this.translate.instant('Encryption Options Saved'));
  }

  private loadPbkdf2iters(): void {
    this.api.call('pool.dataset.query', [[['id', '=', this.data.dataset.id]]])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (datasets: Dataset[]) => {
          const pbkdf2iters = datasets[0].pbkdf2iters;

          if (!pbkdf2iters || pbkdf2iters.rawvalue === '0') {
            return;
          }

          this.form.patchValue({
            pbkdf2iters: Number(pbkdf2iters.rawvalue),
          });
        },
        error: (error: unknown) => {
          this.dialog.error(this.errorHandler.parseError(error));
        },
      });
  }

  private setFormValues(): void {
    let encryptionType = EncryptionType.Passphrase;
    if (!this.hasPassphraseParent) {
      if (this.hasKeyChild) {
        encryptionType = EncryptionType.Key;
      } else {
        encryptionType = isPasswordEncrypted(this.data.dataset) ? EncryptionType.Passphrase : EncryptionType.Key;
      }
    }

    this.form.patchValue({
      inherit_encryption: !isEncryptionRoot(this.data.dataset),
      algorithm: this.data.dataset.encryption_algorithm?.value || '',
      encryption_type: encryptionType,
    });
  }

  private setControlDependencies(): void {
    this.form.controls.algorithm.disable();

    if (this.hasPassphraseParent || this.hasKeyChild) {
      this.form.controls.encryption_type.disable();
    }

    this.subscriptions.push(
      this.form.controls.key.disabledWhile(combineLatestIsAny([
        this.isSetToGenerateKey$,
        this.isKey$.pipe(map((value) => !value)),
        this.isInheriting$,
      ])),
    );

    const arePassphraseFieldsDisabled$ = combineLatestIsAny([this.isKey$, this.isInheriting$]);
    this.subscriptions.push(
      this.form.controls.passphrase.disabledWhile(arePassphraseFieldsDisabled$),
      this.form.controls.confirm_passphrase.disabledWhile(arePassphraseFieldsDisabled$),
      this.form.controls.pbkdf2iters.disabledWhile(arePassphraseFieldsDisabled$),
    );
  }
}
