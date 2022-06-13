import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { combineLatestIsAny } from 'app/helpers/combine-latest-is-any.helper';
import dataset_helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DatasetChangeKeyParams } from 'app/interfaces/dataset-change-key.interface';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import IxValidatorsService from 'app/modules/ix-forms/services/ix-validators.service';
import {
  EncryptionOptionsDialogData,
} from 'app/pages/storage/volumes/encyption-options-dialog/encryption-options-dialog-data.interface';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

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
})
export class EncryptionOptionsDialogComponent implements OnInit {
  form = this.fb.group({
    inherit_encryption: [false],
    encryption_type: [null as EncryptionType],
    generate_key: [false],
    key: ['', [Validators.required, Validators.minLength(64), Validators.maxLength(64)]],
    passphrase: ['', Validators.minLength(8)],
    confirm_passphrase: ['', this.validatorsService.withMessage(
      matchOtherValidator('passphrase'),
      this.translate.instant('Passphrase and confirmation should match.'),
    )],
    pbkdf2iters: [350000, Validators.min(100000)],
    algorithm: [''],
    confirm: [false, [Validators.requiredTrue]],
  });

  subscriptions: Subscription[] = [];

  isInheriting$ = this.form.select((values) => values.inherit_encryption);
  isKey$ = this.form.select((values) => values.encryption_type === EncryptionType.Key);
  isSetToGenerateKey$ = this.form.select((values) => values.generate_key);

  readonly tooltips = {
    encryption_type: dataset_helptext.dataset_form_encryption.encryption_type_tooltip,
    generate_key: dataset_helptext.dataset_form_encryption.generate_key_checkbox_tooltip,
    key: dataset_helptext.dataset_form_encryption.key_tooltip,
    passphrase: dataset_helptext.dataset_form_encryption.passphrase_tooltip,
    pbkdf2iters: dataset_helptext.dataset_form_encryption.pbkdf2iters_tooltip,
  };

  readonly encryptionTypeOptions$ = of(dataset_helptext.dataset_form_encryption.encryption_type_options);

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private dialog: DialogService,
    private dialogRef: MatDialogRef<EncryptionOptionsDialogComponent>,
    private validatorsService: IxValidatorsService,
    private errorHandler: FormErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) public data: EncryptionOptionsDialogData,
  ) {}

  get canInherit(): boolean {
    return (this.data.row.parent as VolumesListDataset)?.encrypted;
  }

  ngOnInit(): void {
    this.setFormValues();
    this.setControlDependencies();
  }

  onSubmit(): void {
    if (this.form.value.inherit_encryption) {
      // Only try to change to inherit if not currently inheriting
      if (!this.data.row.is_encrypted_root) {
        this.dialogRef.close(false);
        return;
      }

      this.setToInherit();
    } else {
      this.saveForm();
    }
  }

  private setToInherit(): void {
    this.loader.open();
    this.ws.call('pool.dataset.inherit_parent_encryption_properties', [this.data.row.id])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
        this.showSuccessDialog();
        this.dialogRef.close(true);
      }, (error: WebsocketError) => {
        this.loader.close();
        this.errorHandler.handleWsFormError(error, this.form);
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

    this.loader.open();
    this.ws.call('pool.dataset.change_key', [this.data.row.id, body])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
        this.showSuccessDialog();
        this.dialogRef.close(true);
      }, (error: WebsocketError) => {
        this.loader.close();
        this.errorHandler.handleWsFormError(error, this.form);
      });
  }

  private showSuccessDialog(): void {
    this.dialog.info(
      this.translate.instant('Encryption Options Saved'),
      this.translate.instant('Encryption options for {id} successfully saved.', { id: this.data.row.id }),
    );
  }

  private setFormValues(): void {
    let encryptionType = EncryptionType.Passphrase;
    if (!this.data.hasPassphraseParent) {
      if (this.data.hasKeyChild) {
        encryptionType = EncryptionType.Key;
      } else {
        encryptionType = this.data.row.is_passphrase ? EncryptionType.Passphrase : EncryptionType.Key;
      }
    }

    this.form.patchValue({
      inherit_encryption: !this.data.row.is_encrypted_root,
      algorithm: this.data.row.encryption_algorithm?.value || '',
      encryption_type: encryptionType,
    });

    if (this.data.row.pbkdf2iters && this.data.row.pbkdf2iters.rawvalue !== '0') {
      this.form.patchValue({
        pbkdf2iters: Number(this.data.row.pbkdf2iters.rawvalue),
      });
    }
  }

  private setControlDependencies(): void {
    this.form.controls.algorithm.disable();

    if (this.data.hasPassphraseParent || this.data.hasKeyChild) {
      this.form.controls['encryption_type'].disable();
    }

    this.subscriptions.push(
      this.form.controls['key'].disabledWhile(combineLatestIsAny([
        this.isSetToGenerateKey$,
        this.isKey$.pipe(map((value) => !value)),
        this.isInheriting$,
      ])),
    );

    const arePassphraseFieldsDisabled$ = combineLatestIsAny([this.isKey$, this.isInheriting$]);
    this.subscriptions.push(
      this.form.controls['passphrase'].disabledWhile(arePassphraseFieldsDisabled$),
      this.form.controls['confirm_passphrase'].disabledWhile(arePassphraseFieldsDisabled$),
      this.form.controls['pbkdf2iters'].disabledWhile(arePassphraseFieldsDisabled$),
    );
  }
}
