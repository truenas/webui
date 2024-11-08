import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  DatasetRecordSize, DatasetSnapdev, DatasetSync, DatasetType,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { helptextZvol } from 'app/helptext/storage/volumes/zvol-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  forbiddenValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

interface ZvolFormData {
  name?: string;
  comments?: string;
  volsize?: string | number;
  force_size?: boolean;
  sync?: string;
  compression?: string;
  deduplication?: string;
  sparse?: boolean;
  readonly?: string;
  volblocksize?: string;
  snapdev?: string;
  inherit_encryption?: boolean;
  encryption?: boolean;
  encryption_type?: string;
  generate_key?: boolean;
  key?: string;
  passphrase?: string;
  confirm_passphrase?: string;
  pbkdf2iters?: number;
  algorithm?: string;
  type?: string;
  encryption_options?: {
    generate_key?: boolean;
    pbkdf2iters?: number;
    algorithm?: string;
    passphrase?: string;
    key?: string;
  };
}

@UntilDestroy()
@Component({
  selector: 'ix-zvol-form',
  templateUrl: './zvol-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxTextareaComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ZvolFormComponent implements OnInit {
  readonly requiredRoles = [Role.DatasetWrite];

  get title(): string {
    return this.isNew
      ? this.translate.instant(helptextZvol.zvol_title_add)
      : this.translate.instant(helptextZvol.zvol_title_edit);
  }

  readonly helptext = helptextZvol;
  parentId: string;
  isNew = true;
  isLoading = false;
  inheritEncryptPlaceholder: string = helptextZvol.dataset_form_encryption.inherit_checkbox_placeholder;
  namesInUse: string[] = [];
  volBlockSizeWarning: string;

  protected encryptedParent = false;
  protected encryptionAlgorithm: string;
  protected passphraseParent = false;
  protected encryptionType: 'key' | 'passphrase' = 'key';
  protected inheritEncryption = true;
  protected generateKey = true;
  protected minimumRecommendedBlockSize: DatasetRecordSize;
  protected origVolSize: number;
  protected origHuman: string | number;

  form = this.formBuilder.group({
    name: ['', [Validators.required, forbiddenValues(this.namesInUse)]],
    comments: [''],
    volsize: ['', Validators.required],
    force_size: [false],
    sync: [null as string, Validators.required],
    compression: [null as string, Validators.required],
    deduplication: [null as string, Validators.required],
    sparse: [false],
    readonly: [null as string, Validators.required],
    volblocksize: [null as string, Validators.required],
    snapdev: [DatasetSnapdev.Hidden as string],
    inherit_encryption: [true],
    encryption: [true],
    encryption_type: ['key', Validators.required],
    generate_key: [true],
    key: ['', [Validators.required, Validators.minLength(64), Validators.maxLength(64)]],
    passphrase: ['', [Validators.required, Validators.minLength(8)]],
    confirm_passphrase: ['', [Validators.required]],
    pbkdf2iters: [350000, [Validators.required, Validators.min(100000)]],
    algorithm: ['AES-256-GCM', Validators.required],
  }, {
    validators: [
      matchOthersFgValidator(
        'confirm_passphrase',
        ['passphrase'],
        this.translate.instant('Confirm Passphrase value must match Passphrase'),
      ),
    ],
  });

  syncOptions: Option[] = [
    { label: this.translate.instant('Standard'), value: DatasetSync.Standard },
    { label: this.translate.instant('Always'), value: DatasetSync.Always },
    { label: this.translate.instant('Disabled'), value: DatasetSync.Disabled },
  ];

  compressionOptions: Option[] = [
    { label: this.translate.instant('Off'), value: 'OFF' },
    { label: this.translate.instant('lz4 (recommended)'), value: 'LZ4' },
    { label: this.translate.instant('zstd (default level, 3)'), value: 'ZSTD' },
    { label: this.translate.instant('zstd-5 (slow)'), value: 'ZSTD-5' },
    { label: this.translate.instant('zstd-7 (very slow)'), value: 'ZSTD-7' },
    { label: this.translate.instant('zstd-fast (default level, 1)'), value: 'ZSTD-FAST' },
    { label: this.translate.instant('gzip (default level, 6)'), value: 'GZIP' },
    { label: this.translate.instant('gzip-1 (fastest)'), value: 'GZIP-1' },
    { label: this.translate.instant('gzip-9 (maximum, slow)'), value: 'GZIP-9' },
    { label: this.translate.instant('zle (runs of zeros)'), value: 'ZLE' },
    { label: this.translate.instant('lzjb (legacy, not recommended)'), value: 'LZJB' },
  ];

  deduplicationOptions: Option[] = [
    { label: this.translate.instant('On'), value: DeduplicationSetting.On },
    { label: this.translate.instant('Verify'), value: DeduplicationSetting.Verify },
    { label: this.translate.instant('Off'), value: DeduplicationSetting.Off },
  ];

  readonlyOptions: Option[] = [
    { label: this.translate.instant('On'), value: OnOff.On },
    { label: this.translate.instant('Off'), value: OnOff.Off },
  ];

  volblocksizeOptions: Option[] = [
    { label: '4 KiB', value: '4K' },
    { label: '8 KiB', value: '8K' },
    { label: '16 KiB', value: '16K' },
    { label: '32 KiB', value: '32K' },
    { label: '64 KiB', value: '64K' },
    { label: '128 KiB', value: '128K' },
  ];

  snapdevOptions: Option[] = [
    { label: this.translate.instant('Visible'), value: DatasetSnapdev.Visible },
    { label: this.translate.instant('Hidden'), value: DatasetSnapdev.Hidden },
  ];

  encryptionTypeOptions: Option[] = [
    { label: this.translate.instant('Key'), value: 'key' },
    { label: this.translate.instant('Passphrase'), value: 'passphrase' },
  ];

  readonly syncOptions$ = of(this.syncOptions);
  readonly compressionOptions$ = of(this.compressionOptions);
  readonly deduplicationOptions$ = of(this.deduplicationOptions);
  readonly readonlyOptions$ = of(this.readonlyOptions);
  readonly volblocksizeOptions$ = of(this.volblocksizeOptions);
  readonly snapdevOptions$ = of(this.snapdevOptions);
  readonly encryptionTypeOptions$ = of(this.encryptionTypeOptions);

  readonly algorithmOptions$ = this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(
    map((algorithms) => Object.keys(algorithms).map((algorithm) => ({ label: algorithm, value: algorithm }))),
  );

  constructor(
    public formatter: IxFormatterService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    protected snackbar: SnackbarService,
    private slideInRef: SlideInRef<ZvolFormComponent>,
    @Inject(SLIDE_IN_DATA) private slideInData: { isNew: boolean; parentId: string },
  ) {
    this.form.controls.key.disable();
    this.form.controls.passphrase.disable();
    this.form.controls.confirm_passphrase.disable();
    this.form.controls.pbkdf2iters.disable();
    this.form.controls.algorithm.disable();
  }

  ngOnInit(): void {
    this.isNew = this.slideInData.isNew;
    this.parentId = this.slideInData.parentId;
    this.zvolFormInit();
  }

  zvolFormInit(): void {
    if (this.parentId) {
      this.setupForm();
    }
  }

  setupForm(): void {
    if (!this.isNew) {
      this.disableEncryptionFields();
    }

    this.isLoading = true;
    this.ws.call('pool.dataset.query', [[['id', '=', this.parentId]]]).pipe(untilDestroyed(this)).subscribe({
      next: (parents) => {
        const parent = parents[0];
        if (parent.encrypted) {
          this.form.controls.encryption.setValue(true);
          this.form.controls.encryption.disable();
        }

        this.namesInUse = parent.children?.map((child) => {
          return /[^/]*$/.exec(child.name)[0];
        }) || [];

        this.inheritEncryptionProperties(parent);

        if (!this.isNew) {
          this.form.controls.name.disable();
        }

        this.addMinimumBlocksizeWarning();

        this.setReadonlyField(parent);

        if (parent?.type === DatasetType.Filesystem) {
          this.inheritFileSystemProperties(parent);
        } else {
          let parentDatasetId: string | string[] = parent.name.split('/');
          parentDatasetId.pop();
          parentDatasetId = parentDatasetId.join('/');

          this.ws.call('pool.dataset.query', [[['id', '=', parentDatasetId]]]).pipe(
            this.errorHandler.catchError(),
            untilDestroyed(this),
          ).subscribe({
            next: (parentDataset) => {
              this.form.controls.sparse.disable();
              this.form.controls.volblocksize.disable();

              this.copyParentProperties(parent);
              this.inheritSyncSource(parent, parentDataset);
              this.inheritCompression(parent, parentDataset);
              this.inheritDeduplication(parent, parentDataset);
              this.inheritSnapdev(parent, parentDataset);

              this.cdr.markForCheck();
            },
            error: (error: unknown): void => {
              this.dialogService.error(this.errorHandler.parseError(error));
            },
          });
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown): void => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  copyParentProperties(parent: Dataset): void {
    const volumesize = parent.volsize.parsed;

    // keep track of original volume size data so we can check to see if the user intended to change since
    // decimal has to be truncated to three decimal places
    this.origVolSize = volumesize;

    const humansize = this.formatter.convertBytesToHumanReadable(volumesize);
    this.origHuman = humansize;

    this.form.controls.name.setValue(parent.name);
    if (parent.comments) {
      this.form.controls.comments.setValue(parent.comments.value);
    } else {
      this.form.controls.comments.setValue('');
    }

    this.form.controls.volsize.setValue(parent.volsize.rawvalue);
  }

  disableEncryptionFields(): void {
    this.setEncryptionFieldsDisabled(true);
    this.form.controls.encryption.disable();
    this.form.controls.inherit_encryption.disable();
  }

  inheritEncryptionProperties(parent: Dataset): void {
    this.encryptedParent = parent.encrypted;
    this.encryptionAlgorithm = parent.encryption_algorithm.value;

    this.inheritEncryptPlaceholder = helptextZvol.dataset_form_encryption.inherit_checkbox_notencrypted;
    if (this.encryptedParent) {
      if (parent.key_format.value === EncryptionKeyFormat.Passphrase) {
        this.passphraseParent = true;
        // if parent is passphrase this dataset cannot be a key type
        this.encryptionType = 'passphrase';
        this.form.controls.encryption_type.disable();
      }
      this.inheritEncryptPlaceholder = helptextZvol.dataset_form_encryption.inherit_checkbox_encrypted;
    }

    if (this.isNew) {
      if (this.encryptedParent && parent.encryption_algorithm) {
        this.form.controls.algorithm.setValue(parent.encryption_algorithm.value);
      }
      this.form.controls.encryption.disable();
      if (this.passphraseParent) {
        this.form.controls.encryption_type.setValue('passphrase');
      }
      this.setEncryptionFieldsDisabled(true);
      this.setupEncryptionFieldEvents();
    }
  }

  inheritSyncSource(parent: Dataset, parentDataset: Dataset[]): void {
    const inheritTr = this.translate.instant('Inherit');
    if (
      parent.sync.source === ZfsPropertySource.Inherited
      || parent.sync.source === ZfsPropertySource.Default
    ) {
      this.syncOptions.unshift({ label: `${inheritTr} (${parentDataset[0].sync.rawvalue})`, value: parentDataset[0].sync.value });
    } else {
      this.syncOptions.unshift({ label: `${inheritTr} (${parentDataset[0].sync.rawvalue})`, value: inherit });
      this.form.controls.sync.setValue(parent.sync.value);
    }
    this.form.controls.sync.setValue(parent.sync.value);
  }

  inheritFileSystemProperties(parent: Dataset): void {
    const inheritTr = this.translate.instant('Inherit');
    this.syncOptions.unshift({ label: `${inheritTr} (${parent.sync.rawvalue})`, value: inherit });
    this.compressionOptions.unshift({ label: `${inheritTr} (${parent.compression.rawvalue})`, value: inherit });
    this.deduplicationOptions.unshift({ label: `${inheritTr} (${parent.deduplication.rawvalue})`, value: inherit });
    this.volblocksizeOptions.unshift({ label: inheritTr, value: inherit });
    this.snapdevOptions.unshift({ label: `${inheritTr} (${parent.snapdev.rawvalue})`, value: inherit });

    this.form.controls.sync.setValue(inherit);
    this.form.controls.compression.setValue(inherit);
    this.form.controls.deduplication.setValue(inherit);
    this.form.controls.readonly.setValue(inherit);
    this.form.controls.snapdev.setValue(inherit);
    this.loadRecommendedBlocksize();
  }

  inheritCompression(parent: Dataset, parentDataset: Dataset[]): void {
    const inheritTr = this.translate.instant('Inherit');
    if (parent.compression.source === ZfsPropertySource.Default) {
      this.compressionOptions.unshift({ label: `${inheritTr} (${parentDataset[0].compression.rawvalue})`, value: parentDataset[0].compression.value });
    } else {
      this.compressionOptions.unshift({ label: `${inheritTr} (${parentDataset[0].compression.rawvalue})`, value: inherit });
    }

    if (parent.compression.source === ZfsPropertySource.Inherited) {
      this.form.controls.compression.setValue(inherit);
    } else {
      this.form.controls.compression.setValue(parent.compression.value);
    }
    if (String(parent.compression.value) === 'GZIP') {
      this.form.controls.compression.setValue(parent.compression.value + '-6');
    }
  }

  inheritDeduplication(parent: Dataset, parentDataset: Dataset[]): void {
    const inheritTr = this.translate.instant('Inherit');
    if (
      parent.deduplication.source === ZfsPropertySource.Inherited
      || parent.deduplication.source === ZfsPropertySource.Default
    ) {
      this.deduplicationOptions.unshift({ label: `${inheritTr} (${parentDataset[0].deduplication.rawvalue})`, value: parentDataset[0].deduplication.value });
    } else {
      this.deduplicationOptions.unshift({ label: `${inheritTr} (${parentDataset[0].deduplication.rawvalue})`, value: inherit });
      this.form.controls.deduplication.setValue(parent.deduplication.value);
    }

    this.form.controls.deduplication.setValue(parent.deduplication.value);
  }

  inheritSnapdev(parent: Dataset, parentDataset: Dataset[]): void {
    const inheritTr = this.translate.instant('Inherit');
    this.snapdevOptions.unshift({ label: `${inheritTr} (${parentDataset[0].snapdev.rawvalue})`, value: inherit });
    if (
      parent.snapdev.source === ZfsPropertySource.Inherited
      || parent.snapdev.source === ZfsPropertySource.Default
    ) {
      this.form.controls.snapdev.setValue(inherit);
    } else {
      this.form.controls.snapdev.setValue(parent.snapdev.value);
    }
  }

  setupEncryptionFieldEvents(): void {
    this.form.controls.inherit_encryption.valueChanges
      .pipe(untilDestroyed(this)).subscribe((inheritEncryption: boolean) => {
        this.inheritEncryption = inheritEncryption;
        if (inheritEncryption) {
          this.setEncryptionFieldsDisabled(true);
          this.setPassphraseFieldsDisabled(true);
          this.setKeyFieldsDisabled(true);
          this.form.controls.encryption.disable();
        }
        if (!inheritEncryption) {
          this.form.controls.encryption_type.enable();
          this.form.controls.algorithm.enable();
          if (this.passphraseParent) { // keep it hidden if it passphrase
            this.form.controls.encryption_type.disable();
          }
          if (this.encryptionType === 'key') {
            this.form.controls.passphrase.disable();
            this.form.controls.confirm_passphrase.disable();
            this.form.controls.pbkdf2iters.disable();
            this.form.controls.generate_key.disable();
          } else {
            this.form.controls.passphrase.enable();
            this.form.controls.confirm_passphrase.enable();
            this.form.controls.pbkdf2iters.enable();
            this.form.controls.generate_key.enable();
          }
          if (this.encryptedParent) {
            this.form.controls.encryption.disable();
          } else {
            this.form.controls.encryption.enable();
          }
        }
      });

    this.form.controls.encryption.valueChanges
      .pipe(untilDestroyed(this)).subscribe((encryption: boolean) => {
        if (this.form.controls.inherit_encryption.value) {
          return;
        }
        if (this.encryptionType === 'key') {
          this.setEncryptionFieldsDisabled(!encryption);
        } else if (encryption) {
          this.form.controls.encryption_type.enable();
          this.form.controls.algorithm.enable();
        } else {
          this.form.controls.encryption_type.disable();
          this.form.controls.algorithm.disable();
        }
        if (this.encryptionType === 'key' && !this.generateKey) {
          this.setKeyFieldsDisabled(!encryption);
        }
        if (this.encryptionType === 'passphrase') {
          this.setPassphraseFieldsDisabled(!encryption);
        }
        if (this.passphraseParent) { // keep this field hidden if parent has a passphrase
          this.form.controls.encryption_type.disable();
        }
      });
    this.form.controls.encryption_type.valueChanges
      .pipe(untilDestroyed(this)).subscribe((type: 'key' | 'passphrase') => {
        this.encryptionType = type;
        const key = type === 'key';
        this.setPassphraseFieldsDisabled(key);
        if (key) {
          this.form.controls.generate_key.enable();
          this.setKeyFieldsDisabled(this.generateKey);
        } else {
          this.form.controls.generate_key.disable();
          this.setKeyFieldsDisabled(true);
        }
      });
    this.form.controls.generate_key.valueChanges
      .pipe(untilDestroyed(this)).subscribe((generateKey: boolean) => {
        this.generateKey = generateKey;
        this.setKeyFieldsDisabled(generateKey);
      });
  }

  setEncryptionFieldsDisabled(disabled: boolean): void {
    if (disabled) {
      this.form.controls.encryption_type.disable();
      this.form.controls.generate_key.disable();
      this.form.controls.algorithm.disable();
    } else {
      this.form.controls.encryption_type.enable();
      this.form.controls.generate_key.enable();
      this.form.controls.algorithm.enable();
    }
  }

  setPassphraseFieldsDisabled(disabled: boolean): void {
    if (disabled) {
      this.form.controls.passphrase.disable();
      this.form.controls.confirm_passphrase.disable();
      this.form.controls.pbkdf2iters.disable();
    } else {
      this.form.controls.passphrase.enable();
      this.form.controls.confirm_passphrase.enable();
      this.form.controls.pbkdf2iters.enable();
    }
  }

  setKeyFieldsDisabled(disabled: boolean): void {
    if (disabled) {
      this.form.controls.key.disable();
    } else {
      this.form.controls.key.enable();
    }
  }

  sendAsBasicOrAdvanced(data: ZvolFormData): ZvolFormData {
    data.type = DatasetType.Volume;

    if (!this.isNew) {
      delete data.name;
      delete data.volblocksize;
      delete data.type;
      delete data.sparse;
    } else {
      data.name = this.parentId + '/' + data.name;
    }

    return data;
  }

  addSubmit(): void {
    this.isLoading = true;
    const data: ZvolFormData = this.sendAsBasicOrAdvanced(this.form.value);

    if (data.sync === inherit) {
      delete data.sync;
    }
    if (data.compression === inherit) {
      delete data.compression;
    }
    if (data.deduplication === inherit) {
      delete data.deduplication;
    }
    if (data.readonly === inherit) {
      delete data.readonly;
    }
    if (data.volblocksize !== inherit) {
      let volblocksizeIntegerValue = parseInt(data.volblocksize.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0]);

      if (volblocksizeIntegerValue === 512) {
        volblocksizeIntegerValue = 512;
      } else {
        volblocksizeIntegerValue = volblocksizeIntegerValue * 1024;
      }

      data.volsize = data.volsize as number;
      data.volsize = data.volsize + (volblocksizeIntegerValue - data.volsize % volblocksizeIntegerValue);
    } else {
      delete data.volblocksize;
    }

    // encryption values
    if (data.inherit_encryption) {
      delete data.encryption;
    } else if (data.encryption) {
      data.encryption_options = {};
      if (data.encryption_type === 'key') {
        data.encryption_options.generate_key = data.generate_key;
        if (!data.generate_key) {
          data.encryption_options.key = data.key;
        }
      } else if (data.encryption_type === 'passphrase') {
        data.encryption_options.passphrase = data.passphrase;
        data.encryption_options.pbkdf2iters = data.pbkdf2iters;
      }
      data.encryption_options.algorithm = data.algorithm;
    }
    delete data.key;
    delete data.generate_key;
    delete data.passphrase;
    delete data.confirm_passphrase;
    delete data.pbkdf2iters;
    delete data.encryption_type;
    delete data.algorithm;

    this.ws.call('pool.dataset.create', [data as DatasetCreate]).pipe(untilDestroyed(this)).subscribe({
      next: (dataset) => this.handleZvolCreateUpdate(dataset),
      error: (error: unknown) => {
        this.isLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  editSubmit(): void {
    this.isLoading = true;
    this.ws.call('pool.dataset.query', [[['id', '=', this.parentId]]]).pipe(untilDestroyed(this)).subscribe({
      next: (datasets) => {
        const data: ZvolFormData = this.sendAsBasicOrAdvanced(this.form.value);

        if (data.inherit_encryption) {
          delete data.encryption;
        } else if (data.encryption) {
          data.encryption_options = {};
          if (data.encryption_type === 'key') {
            data.encryption_options.generate_key = data.generate_key;
            if (!data.generate_key) {
              data.encryption_options.key = data.key;
            }
          } else if (data.encryption_type === 'passphrase') {
            data.encryption_options.passphrase = data.passphrase;
            data.encryption_options.pbkdf2iters = data.pbkdf2iters;
          }
          data.encryption_options.algorithm = data.algorithm;
        }

        delete data.inherit_encryption;
        delete data.key;
        delete data.generate_key;
        delete data.passphrase;
        delete data.confirm_passphrase;
        delete data.pbkdf2iters;
        delete data.encryption_type;
        delete data.algorithm;

        let volblocksizeIntegerValue: number | string = datasets[0].volblocksize.value.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
        volblocksizeIntegerValue = parseInt(volblocksizeIntegerValue, 10);
        if (volblocksizeIntegerValue === 512) {
          volblocksizeIntegerValue = 512;
        } else {
          volblocksizeIntegerValue = volblocksizeIntegerValue * 1024;
        }
        data.volsize = data.volsize as number;
        if (data.volsize && data.volsize % volblocksizeIntegerValue !== 0) {
          data.volsize = data.volsize + (volblocksizeIntegerValue - data.volsize % volblocksizeIntegerValue);
        }
        let roundedVolSize = datasets[0].volsize.parsed;

        if (datasets[0].volsize.parsed % volblocksizeIntegerValue !== 0) {
          roundedVolSize = datasets[0].volsize.parsed
          + (volblocksizeIntegerValue - datasets[0].volsize.parsed % volblocksizeIntegerValue);
        }

        if (!data.volsize || data.volsize >= roundedVolSize) {
          this.ws.call('pool.dataset.update', [this.parentId, data as DatasetUpdate]).pipe(untilDestroyed(this)).subscribe({
            next: (dataset) => this.handleZvolCreateUpdate(dataset),
            error: (error: unknown) => {
              this.isLoading = false;
              this.formErrorHandler.handleWsFormError(error, this.form);
              this.cdr.markForCheck();
            },
          });
        } else {
          this.isLoading = false;
          this.dialogService.error({
            title: helptextZvol.zvol_save_errDialog.title,
            message: helptextZvol.zvol_save_errDialog.msg,
          });
          this.slideInRef.close(false);
        }
      },
      error: (error: unknown): void => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.isNew) {
      this.addSubmit();
    } else {
      this.editSubmit();
    }
  }

  private loadRecommendedBlocksize(): void {
    const root = this.parentId.split('/')[0];
    this.ws.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe((recommendedSize) => {
      this.form.controls.volblocksize.setValue(recommendedSize);
      this.minimumRecommendedBlockSize = recommendedSize;
    });
  }

  private addMinimumBlocksizeWarning(): void {
    this.form.controls.volblocksize.valueChanges
      .pipe(untilDestroyed(this)).subscribe((recordSize: DatasetRecordSize) => {
        const currentSize = this.formatter.convertHumanStringToNum(recordSize);
        const minimumRecommendedSize = this.formatter.convertHumanStringToNum(this.minimumRecommendedBlockSize);
        if (!currentSize || !minimumRecommendedSize || currentSize >= minimumRecommendedSize) {
          this.volBlockSizeWarning = null;
          return;
        }

        this.volBlockSizeWarning = `${this.translate.instant(helptextZvol.blocksize_warning.a)} ${this.minimumRecommendedBlockSize}. ${this.translate.instant(helptextZvol.blocksize_warning.b)}`;
      });
  }

  private setReadonlyField(parent: Dataset): void {
    this.readonlyOptions.unshift({
      label: `${this.translate.instant('Inherit')} (${parent.readonly.rawvalue})`,
      value: inherit,
    });

    let readonlyValue;
    if (this.isNew) {
      readonlyValue = inherit;
    } else {
      readonlyValue = parent.readonly.value;
      if (
        parent.readonly.source === ZfsPropertySource.Default
        || parent.readonly.source === ZfsPropertySource.Inherited
      ) {
        readonlyValue = inherit;
      }
    }
    this.form.controls.readonly.setValue(readonlyValue);
  }

  private handleZvolCreateUpdate(dataset: Dataset): void {
    this.isLoading = false;
    this.slideInRef.close(dataset);

    this.snackbar.success(
      this.isNew
        ? this.translate.instant('Switched to new zvol «{name}».', { name: getDatasetLabel(dataset) })
        : this.translate.instant('Zvol «{name}» updated.', { name: getDatasetLabel(dataset) }),
    );
  }
}
