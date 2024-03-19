import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { matchOthersFgValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-encryption-section',
  templateUrl: './encryption-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncryptionSectionComponent implements OnChanges, OnInit {
  @Input() parent: Dataset;
  @Input() advancedMode: boolean;

  @Output() formValidityChange = new EventEmitter<boolean>();

  get inheritEncryptionLabel(): string {
    return this.parent.encrypted
      ? this.translate.instant('Inherit (encrypted)')
      : this.translate.instant('Inherit (non-encrypted)');
  }

  // TODO: Add conditional validators
  readonly form = this.formBuilder.group({
    inherit_encryption: [true],
    encryption: [true],
    encryption_type: [DatasetEncryptionType.Default],
    generate_key: [true],
    key: ['', [Validators.minLength(64), Validators.maxLength(64)]],
    passphrase: ['', Validators.minLength(8)],
    confirm_passphrase: [''],
    pbkdf2iters: [350000, Validators.min(100000)],
    algorithm: ['AES-256-GCM'],
  }, {
    validators: [
      matchOthersFgValidator(
        'confirm_passphrase',
        ['passphrase'],
        this.translate.instant('Confirm Passphrase value must match Passphrase'),
      ),
    ],
  });

  readonly helptext = helptextDatasetForm;

  encryptionTypeOptions$ = of([
    { label: T('Key'), value: DatasetEncryptionType.Default },
    { label: T('Passphrase'), value: DatasetEncryptionType.Passphrase },
  ]);
  algorithmOptions$ = this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  get hasEncryption(): boolean {
    return this.form.controls.encryption.value;
  }

  get isInheritingEncryption(): boolean {
    return this.form.controls.inherit_encryption.value;
  }

  get isPassphrase(): boolean {
    return this.form.controls.encryption_type.value === DatasetEncryptionType.Passphrase;
  }

  get parentHasPassphrase(): boolean {
    return this.parent
      && this.parent.encrypted
      && this.parent.key_format.value === EncryptionKeyFormat.Passphrase;
  }

  ngOnChanges(): void {
    if (this.parent) {
      this.setInheritValues();
      this.disableEncryptionIfParentEncrypted();
    }
  }

  ngOnInit(): void {
    this.form.statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
      this.formValidityChange.emit(status === 'VALID');
    });
  }

  getPayload(): Partial<DatasetCreate> {
    if (this.isInheritingEncryption) {
      return {};
    }

    if (!this.hasEncryption) {
      return { encryption: false };
    }

    const values = this.form.value;
    const encryptionOptions: DatasetCreate['encryption_options'] = {
      algorithm: values.algorithm,
    };

    if (this.isPassphrase) {
      encryptionOptions.pbkdf2iters = values.pbkdf2iters;
      encryptionOptions.passphrase = values.passphrase;
    } else if (values.generate_key) {
      encryptionOptions.generate_key = true;
    } else {
      encryptionOptions.key = values.key;
    }

    return {
      encryption: true,
      encryption_options: encryptionOptions,
      inherit_encryption: false,
    };
  }

  private setInheritValues(): void {
    if (this.parentHasPassphrase) {
      this.form.controls.encryption_type.setValue(DatasetEncryptionType.Passphrase);
    }

    if (this.parent.encrypted && this.parent.encryption_algorithm?.value) {
      this.form.controls.algorithm.setValue(this.parent.encryption_algorithm.value);
    }
  }

  private disableEncryptionIfParentEncrypted(): void {
    if (!this.parent?.encrypted) {
      return;
    }
    this.form.controls.encryption.disable();
  }
}
