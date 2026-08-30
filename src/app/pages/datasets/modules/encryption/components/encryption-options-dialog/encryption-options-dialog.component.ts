import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent,
  TnFormFieldComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of, startWith } from 'rxjs';
import { minimumPbkdf2Iterations } from 'app/constants/dataset.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Role } from 'app/enums/role.enum';
import { findInTree } from 'app/helpers/find-in-tree.utils';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DatasetChangeKeyParams } from 'app/interfaces/dataset-change-key.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult, ixFormMinSubmitFeedbackMs,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { exactLength } from 'app/modules/forms/ix-forms/validators/validators';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { isPasswordEncrypted, isEncryptionRoot } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { EncryptionOptionsDialogData } from './encryption-options-dialog-data.interface';

enum EncryptionType {
  Key = 'key',
  Passphrase = 'passphrase',
}

interface EncryptionOptionsFormValue {
  inherit_encryption: boolean;
  encryption_type: EncryptionType | null;
  generate_key: boolean;
  key: string;
  passphrase: string;
  confirm_passphrase: string;
  pbkdf2iters: number;
  confirm: boolean;
}

@Component({
  selector: 'ix-encryption-options-dialog',
  templateUrl: './encryption-options-dialog.component.html',
  styleUrls: ['./encryption-options-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // The submit-feedback hold exists so a `<tn-side-panel>`'s progress bar is perceptible on a
    // fast save. A dialog has no such indicator (the job dialog / global loader below covers the
    // request), so holding here would only delay the close.
    { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
  ],
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxFormComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
  ],
})
export class EncryptionOptionsDialog implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private dialog = inject(DialogService);
  protected dialogRef = inject<DialogRef>(DialogRef);
  private errorHandler = inject(ErrorHandlerService);
  data = inject<EncryptionOptionsDialogData>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  /**
   * The shared form wrapper owns the submit lifecycle (loading, snackbar, validation-error
   * mapping); the dialog only re-exposes its Save surface to the `tnDialogAction` footer.
   */
  private readonly ixForm = viewChild(IxFormComponent);

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly InputType = InputType;

  protected form = this.fb.group({
    inherit_encryption: [false],
    encryption_type: this.fb.control<EncryptionType | null>(null),
    generate_key: [false],
    key: ['', [Validators.required, exactLength(64)]],
    passphrase: ['', Validators.minLength(8)],
    confirm_passphrase: [''],
    pbkdf2iters: [minimumPbkdf2Iterations, Validators.min(minimumPbkdf2Iterations)],
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

  // Mirrors of the three values the template branches on. Kept as signals (rather than read
  // through getters) so the OnPush template re-evaluates when the form changes; all three are
  // written from the single `valueChanges` subscription that also owns enabling/disabling.
  protected readonly isInheriting = signal(false);
  protected readonly isKeyEncryption = signal(false);
  protected readonly isGeneratingKey = signal(false);

  readonly tooltips = {
    encryption_type: helptextDatasetForm.encryption.typeTooltip,
    generate_key: helptextDatasetForm.encryption.generateKeyTooltip,
    passphrase: helptextDatasetForm.encryption.passphraseTooltip,
    pbkdf2iters: helptextDatasetForm.encryption.pbkdf2itersTooltip,
  };

  protected readonly encryptionTypeOptions = helptextDatasetForm.encryption.typeOptions;

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

  protected canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  protected submit(): void {
    this.ixForm()?.submit();
  }

  protected handleSubmit = (event: FormSubmitEvent<EncryptionOptionsFormValue>): SubmitResult => {
    const values = event.allValues;

    if (values.inherit_encryption) {
      if (!isEncryptionRoot(this.data.dataset)) {
        // Already inheriting from the parent — there is nothing to change, so close without a
        // request and without reporting a save that never happened.
        return {
          request$: of(undefined),
          successMessage: () => null,
          closeWith: () => false,
        };
      }

      return {
        request$: this.api
          .call('pool.dataset.inherit_parent_encryption_properties', [this.data.dataset.id])
          .pipe(this.loader.withLoader()),
        successMessage: this.translate.instant('Encryption Options Saved'),
      };
    }

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

    return {
      request$: this.dialog.jobDialog(
        this.api.job('pool.dataset.change_key', [this.data.dataset.id, body]),
        { title: this.translate.instant('Updating key type') },
      ).afterClosed(),
      successMessage: this.translate.instant('Encryption Options Saved'),
    };
  };

  private loadPbkdf2iters(): void {
    this.api.call('pool.dataset.query', [[['id', '=', this.data.dataset.id]]])
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
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
          this.errorHandler.showErrorModal(error);
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
      encryption_type: encryptionType,
    });
  }

  private setControlDependencies(): void {
    if (this.hasPassphraseParent || this.hasKeyChild) {
      this.form.controls.encryption_type.disable();
    }

    this.form.valueChanges.pipe(
      startWith(null),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.syncControlStates());
  }

  /**
   * Only the branch of the form the user is actually filling in stays enabled, so the other
   * branch's validators can't block Save (a half-typed passphrase must not stop a key save).
   */
  private syncControlStates(): void {
    // Raw values: `encryption_type` is disabled outright when the dataset's parent or children
    // pin the type, and it still decides which branch is in play.
    const values = this.form.getRawValue();
    const isInheriting = values.inherit_encryption;
    const isKey = values.encryption_type === EncryptionType.Key;

    this.isInheriting.set(isInheriting);
    this.isKeyEncryption.set(isKey);
    this.isGeneratingKey.set(values.generate_key);

    this.setEnabled(this.form.controls.key, isKey && !values.generate_key && !isInheriting);

    const arePassphraseFieldsEnabled = !isKey && !isInheriting;
    this.setEnabled(this.form.controls.passphrase, arePassphraseFieldsEnabled);
    this.setEnabled(this.form.controls.confirm_passphrase, arePassphraseFieldsEnabled);
    this.setEnabled(this.form.controls.pbkdf2iters, arePassphraseFieldsEnabled);
  }

  private setEnabled(control: AbstractControl, enabled: boolean): void {
    if (control.enabled === enabled) {
      return;
    }

    // `emitEvent: false` — this runs from the form's own valueChanges, which would otherwise
    // re-enter.
    if (enabled) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  }
}
