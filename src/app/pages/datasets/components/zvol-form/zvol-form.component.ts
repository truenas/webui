import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, forkJoin, map, Observable, of, tap,
} from 'rxjs';
import {
  specialVdevDefaultThreshold,
  specialVdevDisableThreshold,
  specialVdevMaxThreshold,
  specialVdevMinThreshold,
} from 'app/constants/dataset.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  DatasetRecordSize,
  DatasetSnapdev, datasetSnapdevLabels,
  datasetSyncLabels,
  DatasetType,
} from 'app/enums/dataset.enum';
import { deduplicationSettingLabels } from 'app/enums/deduplication-setting.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { onOffLabels } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { inherit, WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextZvol } from 'app/helptext/storage/volumes/zvol-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
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
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ZvolFormData } from 'app/pages/datasets/components/zvol-form/zvol-form.interface';
import { getUserProperty, transformSpecialSmallBlockSizeForPayload } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-zvol-form',
  templateUrl: './zvol-form.component.html',
  styleUrls: ['./zvol-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    EditableComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    AsyncPipe,
    IxButtonGroupComponent,
    FileSizePipe,
  ],
})
export class ZvolFormComponent implements OnInit {
  formatter = inject(IxFormatterService);
  private translate = inject(TranslateService);
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  private formErrorHandler = inject(FormErrorHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  slideInRef = inject<SlideInRef<{
    isNew: boolean;
    parentOrZvolId: string;
  }, Dataset>>(SlideInRef);

  protected readonly requiredRoles = [Role.DatasetWrite];

  get title(): string {
    return this.isNew
      ? this.translate.instant(helptextZvol.addTitle)
      : this.translate.instant(helptextZvol.editTitle);
  }

  protected parentOrZvolId: string;
  protected isNew = true;

  readonly helptext = helptextZvol;
  inheritEncryptPlaceholder: string = helptextZvol.encryption.inheritLabel;
  namesInUse: string[] = [];
  volBlockSizeWarning: string | null;

  protected isLoading = signal(false);

  protected encryptedParent = false;
  protected encryptionAlgorithm: string;
  protected passphraseParent = false;
  protected encryptionType: 'key' | 'passphrase' = 'key';
  protected inheritEncryption = true;
  protected generateKey = true;
  protected minimumRecommendedBlockSize: DatasetRecordSize;
  showCustomizeSpecialSmallBlockSize = false;

  form = this.formBuilder.group({
    name: ['', [Validators.required, forbiddenValues(this.namesInUse)]],
    comments: [''],
    volsize: ['', Validators.required],
    force_size: [false],
    sync: [null as string | null, Validators.required],
    compression: [null as string | null, Validators.required],
    deduplication: [null as string | null, Validators.required],
    sparse: [false],
    readonly: [null as string | null, Validators.required],
    volblocksize: [null as string | null, Validators.required],
    snapdev: [DatasetSnapdev.Hidden as string],
    special_small_block_size: [inherit as WithInherit<'ON' | 'OFF'>],
    special_small_block_size_custom: [null as number | null],
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

  syncOptions: Option[] = mapToOptions(datasetSyncLabels, this.translate);

  protected compressionOptions: Option[] = [
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

  protected deduplicationOptions: Option[] = mapToOptions(deduplicationSettingLabels, this.translate);
  protected snapdevOptions: Option[] = mapToOptions(datasetSnapdevLabels, this.translate);
  protected readonlyOptions: Option[] = mapToOptions(onOffLabels, this.translate);
  protected specialSmallBlockSizeOptions: Option[] = [
    { label: this.translate.instant('On'), value: 'ON' },
    { label: this.translate.instant('Off'), value: 'OFF' },
  ];

  protected volblocksizeOptions: Option[] = [
    { label: '4 KiB', value: '4K' },
    { label: '8 KiB', value: '8K' },
    { label: '16 KiB', value: '16K' },
    { label: '32 KiB', value: '32K' },
    { label: '64 KiB', value: '64K' },
    { label: '128 KiB', value: '128K' },
  ];

  private encryptionTypeOptions: Option[] = [
    { label: this.translate.instant('Key'), value: 'key' },
    { label: this.translate.instant('Passphrase'), value: 'passphrase' },
  ];

  readonly syncOptions$ = of(this.syncOptions);
  readonly compressionOptions$ = of(this.compressionOptions);
  readonly deduplicationOptions$ = of(this.deduplicationOptions);
  readonly readonlyOptions$ = of(this.readonlyOptions);
  readonly volblocksizeOptions$ = of(this.volblocksizeOptions);
  readonly snapdevOptions$ = of(this.snapdevOptions);
  readonly specialSmallBlockSizeOptions$ = of(this.specialSmallBlockSizeOptions);
  readonly encryptionTypeOptions$ = of(this.encryptionTypeOptions);

  readonly algorithmOptions$ = this.api.call('pool.dataset.encryption_algorithm_choices').pipe(
    map((algorithms) => Object.keys(algorithms).map((algorithm) => ({ label: algorithm, value: algorithm }))),
  );

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.form.controls.key.disable();
    this.form.controls.passphrase.disable();
    this.form.controls.confirm_passphrase.disable();
    this.form.controls.pbkdf2iters.disable();
    this.form.controls.algorithm.disable();
  }

  ngOnInit(): void {
    this.isNew = this.slideInRef.getData().isNew;
    this.parentOrZvolId = this.slideInRef.getData().parentOrZvolId;

    // Set up conditional validation for special_small_block_size_custom
    this.form.controls.special_small_block_size.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const customControl = this.form.controls.special_small_block_size_custom;
      if (value === 'ON') {
        customControl.setValidators([
          Validators.min(specialVdevMinThreshold),
          Validators.max(specialVdevMaxThreshold),
        ]);
      } else {
        customControl.clearValidators();
      }
      customControl.updateValueAndValidity();
    });

    if (this.parentOrZvolId) {
      this.setupForm();
    }
  }

  private setupForm(): void {
    if (!this.isNew) {
      this.disableEncryptionFields();
      this.form.controls.name.disable();
    }

    this.isLoading.set(true);
    forkJoin([
      this.api.call('pool.dataset.query', [[['id', '=', this.parentOrZvolId]]]),
      this.loadRecommendedBlocksize(),
    ])
      .pipe(
        finalize(() => this.isLoading.set(false)),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      ).subscribe({
        next: ([parents]) => {
          const parentOrZvol = parents[0];
          if (parentOrZvol.encrypted) {
            this.form.controls.encryption.setValue(true);
            this.form.controls.encryption.disable();
          }

          this.namesInUse = parentOrZvol.children?.map((child) => {
            return /[^/]*$/.exec(child.name)[0];
          }) || [];

          this.inheritEncryptionProperties(parentOrZvol);

          this.addMinimumBlocksizeWarning();

          this.setReadonlyField(parentOrZvol);

          if (parentOrZvol?.type === DatasetType.Filesystem) {
            this.inheritFileSystemProperties(parentOrZvol);
          } else {
            let parentDatasetId: string | string[] = parentOrZvol.name.split('/');
            parentDatasetId.pop();
            parentDatasetId = parentDatasetId.join('/');

            this.api.call('pool.dataset.query', [[['id', '=', parentDatasetId]]]).pipe(
              this.errorHandler.withErrorHandler(),
              untilDestroyed(this),
            ).subscribe({
              next: (parentDataset) => {
                this.form.controls.sparse.disable();
                this.form.controls.volblocksize.disable();

                this.copyParentProperties(parentOrZvol);
                this.inheritSyncSource(parentOrZvol, parentDataset);
                this.inheritCompression(parentOrZvol, parentDataset);
                this.inheritDeduplication(parentOrZvol, parentDataset);
                this.inheritSnapdev(parentOrZvol, parentDataset);
                this.inheritSpecialSmallBlockSize(parentOrZvol, parentDataset);

                this.cdr.markForCheck();
              },
            });
          }
          this.cdr.markForCheck();
        },
      });
  }

  private copyParentProperties(parent: Dataset): void {
    this.form.controls.name.setValue(parent.name);
    const comments = getUserProperty<string>(parent, 'comments');
    this.form.controls.comments.setValue(comments?.value || '');

    this.form.controls.volsize.setValue(parent.volsize.rawvalue);

    // Handle special_small_block_size
    // Check if special_small_block_size is inherited or locally set
    const isInherited = !parent.special_small_block_size
      || parent.special_small_block_size.source === ZfsPropertySource.Inherited
      || parent.special_small_block_size.source === ZfsPropertySource.Default;

    if (parent.special_small_block_size && !isInherited) {
      const specialSmallBlockSize = this.formatter.convertHumanStringToNum(parent.special_small_block_size.value);

      if (specialSmallBlockSize === 0) {
        // 0 means OFF (disabled)
        this.form.controls.special_small_block_size.setValue('OFF');
      } else if (specialSmallBlockSize > 0 && specialSmallBlockSize < specialVdevDisableThreshold) {
        // Between 0 and 16 MiB means ON with custom value
        this.form.controls.special_small_block_size.setValue('ON');
        this.form.controls.special_small_block_size_custom.setValue(specialSmallBlockSize);
        this.showCustomizeSpecialSmallBlockSize = true;
      } else {
        // 16 MiB or larger also means OFF (legacy values)
        this.form.controls.special_small_block_size.setValue('OFF');
      }
    }
  }

  private disableEncryptionFields(): void {
    this.setEncryptionFieldsDisabled(true);
    this.form.controls.encryption.disable();
    this.form.controls.inherit_encryption.disable();
  }

  private inheritEncryptionProperties(parent: Dataset): void {
    this.encryptedParent = parent.encrypted;
    this.encryptionAlgorithm = parent.encryption_algorithm.value;

    this.inheritEncryptPlaceholder = helptextZvol.encryption.inheritNotEncrypted;
    if (this.encryptedParent) {
      if (parent.key_format.value === EncryptionKeyFormat.Passphrase) {
        this.passphraseParent = true;
        // if parent is passphrase this dataset cannot be a key type
        this.encryptionType = 'passphrase';
        this.form.controls.encryption_type.disable();
      }
      this.inheritEncryptPlaceholder = helptextZvol.encryption.inheritEncrypted;
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

  private inheritSyncSource(parent: Dataset, parentDataset: Dataset[]): void {
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

  private inheritFileSystemProperties(parent: Dataset): void {
    const inheritLabel = this.translate.instant('Inherit');
    this.syncOptions.unshift({ label: `${inheritLabel} (${parent.sync.rawvalue})`, value: inherit });
    this.compressionOptions.unshift({ label: `${inheritLabel} (${parent.compression.rawvalue})`, value: inherit });
    this.deduplicationOptions.unshift({ label: `${inheritLabel} (${parent.deduplication.rawvalue})`, value: inherit });
    this.volblocksizeOptions.unshift({ label: inheritLabel, value: inherit });
    this.snapdevOptions.unshift({ label: `${inheritLabel} (${parent.snapdev.rawvalue})`, value: inherit });

    // Add inherit option for special_small_block_size
    if (parent.special_small_block_size) {
      const sizeInBytes = this.formatter.convertHumanStringToNum(parent.special_small_block_size.value);
      let inheritLabelValue: string;
      if (sizeInBytes >= specialVdevDisableThreshold) {
        inheritLabelValue = `${inheritLabel} (off)`;
      } else {
        const formattedSize = buildNormalizedFileSize(sizeInBytes);
        inheritLabelValue = `${inheritLabel} (${formattedSize})`;
      }
      this.specialSmallBlockSizeOptions.unshift({ label: inheritLabelValue, value: inherit });
    } else {
      this.specialSmallBlockSizeOptions.unshift({ label: inheritLabel, value: inherit });
    }

    this.form.controls.sync.setValue(inherit);
    this.form.controls.compression.setValue(inherit);
    this.form.controls.deduplication.setValue(inherit);
    this.form.controls.readonly.setValue(inherit);
    this.form.controls.snapdev.setValue(inherit);
  }

  private inheritCompression(parent: Dataset, parentDataset: Dataset[]): void {
    const inheritLabel = this.translate.instant('Inherit');
    if (parent.compression.source === ZfsPropertySource.Default) {
      this.compressionOptions.unshift({
        label: `${inheritLabel} (${parentDataset[0].compression.rawvalue})`,
        value: parentDataset[0].compression.value,
      });
    } else {
      this.compressionOptions.unshift({ label: `${inheritLabel} (${parentDataset[0].compression.rawvalue})`, value: inherit });
    }

    if (parent.compression.source === ZfsPropertySource.Inherited) {
      this.form.controls.compression.setValue(inherit);
    } else {
      this.form.controls.compression.setValue(parent.compression.value);
    }
  }

  private inheritDeduplication(parent: Dataset, parentDataset: Dataset[]): void {
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

  private inheritSnapdev(parent: Dataset, parentDataset: Dataset[]): void {
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

  private inheritSpecialSmallBlockSize(parent: Dataset, parentDataset: Dataset[]): void {
    const inheritLabel = this.translate.instant('Inherit');
    if (parentDataset[0].special_small_block_size) {
      const sizeInBytes = this.formatter.convertHumanStringToNum(parentDataset[0].special_small_block_size.value);
      let inheritLabelValue: string;
      if (sizeInBytes === 0 || sizeInBytes >= specialVdevDisableThreshold) {
        inheritLabelValue = `${inheritLabel} (off)`;
      } else {
        const formattedSize = buildNormalizedFileSize(sizeInBytes);
        inheritLabelValue = `${inheritLabel} (${formattedSize})`;
      }
      this.specialSmallBlockSizeOptions.unshift({ label: inheritLabelValue, value: inherit });
    } else {
      this.specialSmallBlockSizeOptions.unshift({ label: inheritLabel, value: inherit });
    }
  }

  private setupEncryptionFieldEvents(): void {
    this.form.controls.inherit_encryption.valueChanges
      .pipe(untilDestroyed(this)).subscribe((inheritEncryption) => {
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

  private setEncryptionFieldsDisabled(disabled: boolean): void {
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

  private setPassphraseFieldsDisabled(disabled: boolean): void {
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

  private setKeyFieldsDisabled(disabled: boolean): void {
    if (disabled) {
      this.form.controls.key.disable();
    } else {
      this.form.controls.key.enable();
    }
  }

  private getPayload(data: ZvolFormData): ZvolFormData {
    data.type = DatasetType.Volume;

    if (!this.isNew) {
      delete data.name;
      delete data.volblocksize;
      delete data.type;
      delete data.sparse;
    } else {
      data.name = this.parentOrZvolId + '/' + (data.name || '');
    }

    return data;
  }

  private addSubmit(): void {
    this.isLoading.set(true);
    const data: ZvolFormData = this.getPayload(this.form.getRawValue());

    // Handle special_small_block_size transformation
    const transformedValue = transformSpecialSmallBlockSizeForPayload(
      data.special_small_block_size as WithInherit<'ON' | 'OFF'>,
      data.special_small_block_size_custom,
    );
    if (transformedValue === undefined || transformedValue === inherit) {
      // For zvols, delete the property when inherit or undefined
      delete data.special_small_block_size;
    } else {
      data.special_small_block_size = transformedValue;
    }

    // Remove UI-only field
    delete data.special_small_block_size_custom;

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
      // When inherit_encryption is true, don't send encryption field at all
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
    // Keep inherit_encryption in the payload - don't delete it
    delete data.key;
    delete data.generate_key;
    delete data.passphrase;
    delete data.confirm_passphrase;
    delete data.pbkdf2iters;
    delete data.encryption_type;
    delete data.algorithm;

    this.api.call('pool.dataset.create', [data as DatasetCreate]).pipe(untilDestroyed(this)).subscribe({
      next: (dataset) => this.handleZvolCreateUpdate(dataset),
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private editSubmit(): void {
    this.isLoading.set(true);
    this.api.call('pool.dataset.query', [[['id', '=', this.parentOrZvolId]]]).pipe(untilDestroyed(this)).subscribe({
      next: (datasets) => {
        const data: ZvolFormData = this.getPayload(this.form.getRawValue());

        // Handle special_small_block_size transformation
        const transformedValue = transformSpecialSmallBlockSizeForPayload(
          data.special_small_block_size as WithInherit<'ON' | 'OFF'>,
          data.special_small_block_size_custom,
        );
        if (transformedValue === undefined || transformedValue === inherit) {
          // For zvols, delete the property when inherit or undefined
          delete data.special_small_block_size;
        } else {
          data.special_small_block_size = transformedValue;
        }

        // Remove UI-only field
        delete data.special_small_block_size_custom;

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

        // Delete all encryption-related fields when editing
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
        data.volsize = Number(data.volsize);
        if (data.volsize && data.volsize % volblocksizeIntegerValue !== 0) {
          data.volsize = data.volsize + (volblocksizeIntegerValue - data.volsize % volblocksizeIntegerValue);
        }
        let roundedVolSize = datasets[0].volsize.parsed;

        if (datasets[0].volsize.parsed % volblocksizeIntegerValue !== 0) {
          roundedVolSize = datasets[0].volsize.parsed
          + (volblocksizeIntegerValue - datasets[0].volsize.parsed % volblocksizeIntegerValue);
        }

        if (!data.volsize || data.volsize >= roundedVolSize) {
          this.api.call('pool.dataset.update', [this.parentOrZvolId, data as DatasetUpdate]).pipe(untilDestroyed(this)).subscribe({
            next: (dataset) => this.handleZvolCreateUpdate(dataset),
            error: (error: unknown) => {
              this.isLoading.set(false);
              this.formErrorHandler.handleValidationErrors(error, this.form);
              this.cdr.markForCheck();
            },
          });
        } else {
          this.isLoading.set(false);
          this.dialogService.error({
            title: helptextZvol.zvolSaveError.title,
            message: helptextZvol.zvolSaveError.msg,
          });
        }
      },
      error: (error: unknown): void => {
        this.errorHandler.showErrorModal(error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  protected onSubmit(): void {
    if (this.isNew) {
      this.addSubmit();
    } else {
      this.editSubmit();
    }
  }

  protected getOptionLabel(options: Option[], value: unknown): string {
    return options.find((option) => option.value === value)?.label ?? String(value ?? '');
  }

  private loadRecommendedBlocksize(): Observable<unknown> {
    const root = this.parentOrZvolId.split('/')[0];

    return this.api.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(
      tap((recommendedSize) => {
        this.form.controls.volblocksize.setValue(recommendedSize);
        this.minimumRecommendedBlockSize = recommendedSize;
      }),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    );
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

        this.volBlockSizeWarning = `${this.translate.instant(helptextZvol.blocksizeWarning.a)} ${this.minimumRecommendedBlockSize}. ${this.translate.instant(helptextZvol.blocksizeWarning.b)}`;
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
    this.isLoading.set(false);
    this.slideInRef.close({ response: dataset });
  }

  toggleCustomizeSpecialSmallBlockSize(): void {
    this.showCustomizeSpecialSmallBlockSize = !this.showCustomizeSpecialSmallBlockSize;
    if (this.showCustomizeSpecialSmallBlockSize && !this.form.value.special_small_block_size_custom) {
      // Set a sensible default when opening customize (128 KiB)
      this.form.patchValue({ special_small_block_size_custom: specialVdevDefaultThreshold });
    }
    this.cdr.markForCheck();
  }
}
