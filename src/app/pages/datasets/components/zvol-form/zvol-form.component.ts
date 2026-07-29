// cspell:ignore zvol zvols volsize volblocksize snapdev Snapdev Vdev helptext ngneat rawvalue pbkdf
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonToggleComponent, TnButtonToggleGroupComponent, TnCheckboxComponent,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  finalize, forkJoin, map, Observable, switchMap, tap, throwError,
} from 'rxjs';
import {
  minimumPbkdf2Iterations,
  specialVdevDefaultThreshold,
  specialVdevMaxThreshold,
  specialVdevMinThreshold,
} from 'app/constants/dataset.constants';
import {
  DatasetCaseSensitivity,
  DatasetRecordSize,
  DatasetSnapdev, datasetSnapdevLabels,
  datasetSyncLabels,
  DatasetType,
} from 'app/enums/dataset.enum';
import { deduplicationSettingLabels } from 'app/enums/deduplication-setting.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { OnOff, onOffLabels } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { inherit, WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextZvol } from 'app/helptext/storage/volumes/zvol-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  forbiddenValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { exactLength } from 'app/modules/forms/ix-forms/validators/validators';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';
import { ZvolFormData } from 'app/pages/datasets/components/zvol-form/zvol-form.interface';
import { getUserProperty, transformSpecialSmallBlockSizeForPayload } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { LicenseService } from 'app/services/license.service';

// volsize values round-trip through the file-size formatter, so a re-saved
// edit can drift by a few bytes. Treat anything within 0.1% of the original
// as unchanged to avoid spurious payload churn.
const volsizeUnchangedRelativeTolerance = 0.001;

@Component({
  selector: 'ix-zvol-form',
  templateUrl: './zvol-form.component.html',
  styleUrls: ['./zvol-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnButtonToggleGroupComponent,
    TnButtonToggleComponent,
    ReactiveFormsModule,
    TranslateModule,
    EditableComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    AsyncPipe,
    FileSizePipe,
  ],
})
export class ZvolFormComponent extends IxFormHostForm<Dataset> implements OnInit {
  private formatter = inject(IxFormatterService);
  private translate = inject(TranslateService);
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private licenseService = inject(LicenseService);
  slideInRef = inject<SlideInRef<{
    isNew: boolean;
    parentOrZvolId: string;
  }, Dataset>>(SlideInRef, { optional: true });

  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];

  /**
   * Edit/create parameters when hosted in a `<tn-side-panel>` (no `SlideInRef` to carry
   * data). Unused in the legacy SlideIn host (which supplies them via `slideInRef.getData()`).
   */
  readonly params = input<{ isNew: boolean; parentOrZvolId: string }>();

  private savedDataset: Dataset | undefined;

  protected readonly addTitle = this.translate.instant(helptextZvol.addTitle);
  protected readonly editTitle = this.translate.instant(helptextZvol.editTitle);

  protected parentOrZvolId: string;
  protected isNew = true;

  readonly helptext = helptextZvol;
  readonly OnOff = OnOff;
  protected readonly InputType = InputType;
  inheritEncryptPlaceholder: string = helptextZvol.encryption.inheritLabel;
  volBlockSizeWarning: string | null;

  protected setupLoading = signal(false);
  protected formSnapshot = signal<Record<string, unknown> | null>(null);

  protected encryptedParent = false;
  protected encryptionAlgorithm: string;
  protected passphraseParent = false;
  protected encryptionType: 'key' | 'passphrase' = 'key';
  protected inheritEncryption = true;
  protected generateKey = true;
  protected minimumRecommendedBlockSize: DatasetRecordSize;
  private originalReadonlyValue: string;
  private inheritedReadonlyValue: string;
  protected volsizeReadonlyWarning: string | null = null;
  private originalVolsize: number | null = null;
  protected hasDeduplication = false;

  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    comments: [''],
    volsize: ['', [Validators.required, Validators.min(1)]],
    force_size: [false],
    sync: [null as string | null, Validators.required],
    compression: [null as string | null, Validators.required],
    deduplication: [null as string | null, Validators.required],
    sparse: [false],
    readonly: [null as string | null, Validators.required],
    volblocksize: [null as string | null, Validators.required],
    snapdev: [DatasetSnapdev.Hidden as string],
    special_small_block_size: [inherit as WithInherit<OnOff>],
    special_small_block_size_custom: [null as number | null],
    inherit_encryption: [true],
    encryption: [true],
    encryption_type: ['key', Validators.required],
    generate_key: [true],
    key: ['', [Validators.required, exactLength(64)]],
    passphrase: ['', [Validators.required, Validators.minLength(8)]],
    confirm_passphrase: ['', [Validators.required]],
    pbkdf2iters: [minimumPbkdf2Iterations, [Validators.required, Validators.min(minimumPbkdf2Iterations)]],
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
  protected compressionOptions: Option[] = [];
  protected deduplicationOptions: Option[] = mapToOptions(deduplicationSettingLabels, this.translate);
  protected snapdevOptions: Option[] = mapToOptions(datasetSnapdevLabels, this.translate);
  protected readonlyOptions: Option[] = mapToOptions(onOffLabels, this.translate);
  protected specialSmallBlockSizeOptions: Option[] = [
    { label: this.translate.instant('On'), value: OnOff.On },
    { label: this.translate.instant('Off'), value: OnOff.Off },
  ];

  protected volblocksizeOptions: Option[] = [
    { label: '4 KiB', value: '4K' },
    { label: '8 KiB', value: '8K' },
    { label: '16 KiB', value: '16K' },
    { label: '32 KiB', value: '32K' },
    { label: '64 KiB', value: '64K' },
    { label: '128 KiB', value: '128K' },
  ];

  protected encryptionTypeOptions: Option[] = [
    { label: this.translate.instant('Key'), value: 'key' },
    { label: this.translate.instant('Passphrase'), value: 'passphrase' },
  ];

  readonly algorithmOptions$ = this.api.call('pool.dataset.encryption_algorithm_choices').pipe(
    map((algorithms) => Object.keys(algorithms).map((algorithm) => ({ label: algorithm, value: algorithm }))),
  );

  constructor() {
    super();
    this.form.controls.key.disable();
    this.form.controls.passphrase.disable();
    this.form.controls.confirm_passphrase.disable();
    this.form.controls.pbkdf2iters.disable();
    this.form.controls.algorithm.disable();
  }

  ngOnInit(): void {
    const data = this.slideInRef ? this.slideInRef.getData() : this.params();
    this.isNew = data?.isNew ?? true;
    this.parentOrZvolId = data?.parentOrZvolId ?? '';

    this.checkIfDedupIsSupported();

    // Set up conditional validation for special_small_block_size_custom
    this.form.controls.special_small_block_size.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => {
      const customControl = this.form.controls.special_small_block_size_custom;
      if (value === OnOff.On) {
        customControl.setValidators([
          Validators.min(specialVdevMinThreshold),
          Validators.max(specialVdevMaxThreshold),
        ]);
        // Set default threshold if not already set
        if (!customControl.value) {
          customControl.setValue(specialVdevDefaultThreshold);
        }
      } else {
        customControl.clearValidators();
      }
      customControl.updateValueAndValidity();
    });

    if (this.parentOrZvolId) {
      this.setupForm();
    }
  }

  protected handleSubmit = (event: FormSubmitEvent<ZvolFormData>): SubmitResult => {
    if (this.isNew) {
      return this.buildCreateResult(event);
    }
    return this.buildEditResult(event);
  };

  /**
   * `<ix-form>` closes host-agnostically: in a SlideIn host it hands the saved zvol back
   * through the SlideInRef; in a `<tn-side-panel>` it only signals success via `closed`, so
   * re-emit the zvol captured in the submit `onSuccess` hook to the panel host.
   */
  protected onFormClosed(): void {
    if (this.savedDataset) {
      this.closed.emit(this.savedDataset);
    }
  }

  protected getOptionLabel(options: Option[], value: unknown): string {
    return options.find((option) => option.value === value)?.label ?? String(value ?? '');
  }

  private checkIfDedupIsSupported(): void {
    this.licenseService.hasDedup$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((hasDedup) => {
      this.hasDeduplication = hasDedup;
      this.updateDeduplicationControl();
      this.cdr.markForCheck();
    });
  }

  // When deduplication is hidden (Enterprise without a dedup license), the
  // control still carries `Validators.required`, which would silently block
  // submission. Drop the validator while hidden; the value is left untouched
  // and the payload builders omit `deduplication` entirely based on
  // `hasDeduplication`.
  private updateDeduplicationControl(): void {
    const control = this.form.controls.deduplication;
    if (this.hasDeduplication) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private buildCreateResult(event: FormSubmitEvent<ZvolFormData>): SubmitResult {
    const data = this.buildCreatePayload(event.allValues);
    return {
      request$: this.api.call('pool.dataset.create', [data as DatasetCreate]),
      successMessage: this.translate.instant('Zvol created'),
      onSuccess: (result) => {
        this.savedDataset = result as Dataset;
      },
    };
  }

  private buildEditResult(event: FormSubmitEvent<ZvolFormData>): SubmitResult {
    return {
      request$: this.api.call('pool.dataset.query', [[['id', '=', this.parentOrZvolId]]]).pipe(
        switchMap((datasets) => {
          const { payload, canSubmit } = this.buildEditPayload(event, datasets);
          if (!canSubmit) {
            return throwError(() => new Error('VOLSIZE_VALIDATION'));
          }
          return this.api.call('pool.dataset.update', [this.parentOrZvolId, payload]);
        }),
      ),
      successMessage: this.translate.instant('Zvol updated'),
      onSuccess: (result) => {
        this.savedDataset = result as Dataset;
      },
      onError: (error: unknown) => {
        if (error instanceof Error && error.message === 'VOLSIZE_VALIDATION') {
          this.dialogService.error({
            title: helptextZvol.zvolSaveError.title,
            message: helptextZvol.zvolSaveError.msg,
          });
          return true;
        }
        return false;
      },
    };
  }

  private buildCreatePayload(allValues: ZvolFormData): ZvolFormData {
    const data: ZvolFormData = { ...allValues };
    data.type = DatasetType.Volume;
    data.name = this.parentOrZvolId + '/' + (data.name || '');

    // Handle special_small_block_size transformation
    const transformedValue = transformSpecialSmallBlockSizeForPayload(
      data.special_small_block_size as WithInherit<OnOff>,
      data.special_small_block_size_custom,
    );
    if (transformedValue === undefined || transformedValue === inherit) {
      delete data.special_small_block_size;
    } else {
      data.special_small_block_size = transformedValue;
    }
    delete data.special_small_block_size_custom;

    if (data.sync === inherit) {
      delete data.sync;
    }
    if (data.compression === inherit) {
      delete data.compression;
    }
    if (data.deduplication === inherit || !this.hasDeduplication) {
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

      data.volsize = this.alignVolsizeToBlocksize(data.volsize as number, volblocksizeIntegerValue);
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
        data.encryption_options.pbkdf2iters = Number(data.pbkdf2iters);
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

    return data;
  }

  private buildEditPayload(
    event: FormSubmitEvent<ZvolFormData>,
    datasets: Dataset[],
  ): { payload: DatasetUpdate; canSubmit: boolean } {
    // Payload mixes two sources on purpose:
    //   - `event.changedValues` for the bulk of the keys (diff-based, so
    //     untouched fields aren't sent).
    //   - `this.form.controls.*` / `originalVolsize` / `originalReadonlyValue`
    //     for the readonly/volsize interaction below, because the decision of
    //     whether to include `volsize` depends on the *effective* readonly
    //     value (which resolves `inherit` against the parent) and the
    //     precision-preserved original volsize — neither of which survives
    //     the diff cleanly.
    // Refactors that move logic between the two must keep readonly and volsize
    // reading from the live form, not from `changedValues`.
    const data: ZvolFormData = { ...event.changedValues };

    // Remove fields that should never be sent on edit
    delete data.name;
    delete data.volblocksize;
    delete data.type;
    delete data.sparse;
    delete data.inherit_encryption;
    delete data.encryption;
    delete data.encryption_type;
    delete data.generate_key;
    delete data.key;
    delete data.passphrase;
    delete data.confirm_passphrase;
    delete data.pbkdf2iters;
    delete data.algorithm;

    // Never send deduplication when the field is hidden (Enterprise without a
    // dedup license) — it isn't user-editable in that state.
    if (!this.hasDeduplication) {
      delete data.deduplication;
    }

    // Handle readonly/volsize interaction
    const readonlyValue = this.form.controls.readonly.value;
    const effectiveCurrentValue = this.getEffectiveReadonlyValue(readonlyValue);
    const effectiveOriginalValue = this.getEffectiveReadonlyValue(this.originalReadonlyValue);
    const isEffectivelyReadonlyOn = effectiveCurrentValue === OnOff.On as string;
    const hasEffectivelyChanged = effectiveCurrentValue !== effectiveOriginalValue;
    if (isEffectivelyReadonlyOn || hasEffectivelyChanged) {
      delete data.volsize;
    }

    // Handle special_small_block_size transformation.
    //
    // Inherit is intentionally dropped from the payload rather than sent as
    // 'INHERIT': the zvol UI has always stripped it on create, and the zvol
    // update endpoint treats an omitted key as "leave inherited" on its side.
    // If the server ever grows a distinction between "still inherit" and
    // "no change", this branch must start sending `inherit` explicitly (as
    // dataset-form already does) — otherwise explicit → inherit transitions
    // would silently no-op.
    //
    // `in changedValues` gates on "did either paired control change" (membership
    // = changed); the value itself comes from allValues so both halves are seen.
    if ('special_small_block_size' in event.changedValues || 'special_small_block_size_custom' in event.changedValues) {
      const transformedValue = transformSpecialSmallBlockSizeForPayload(
        event.allValues.special_small_block_size as WithInherit<OnOff>,
        event.allValues.special_small_block_size_custom,
      );
      if (transformedValue === undefined || transformedValue === inherit) {
        delete data.special_small_block_size;
      } else {
        data.special_small_block_size = transformedValue;
      }
    }
    delete data.special_small_block_size_custom;

    // Handle volsize alignment and validation
    let canSubmit = true;
    if (data.volsize !== undefined) {
      let volblocksizeIntegerValue: number | string = datasets[0].volblocksize.value.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksizeIntegerValue = parseInt(volblocksizeIntegerValue, 10);
      if (volblocksizeIntegerValue === 512) {
        volblocksizeIntegerValue = 512;
      } else {
        volblocksizeIntegerValue = volblocksizeIntegerValue * 1024;
      }

      const parsedVolsize = Number(data.volsize);

      const hasVolumeChanged = this.originalVolsize === null
        || Math.abs(parsedVolsize - this.originalVolsize) / this.originalVolsize > volsizeUnchangedRelativeTolerance;

      if (hasVolumeChanged) {
        data.volsize = this.alignVolsizeToBlocksize(parsedVolsize, volblocksizeIntegerValue);
      } else {
        data.volsize = this.originalVolsize;
      }

      let roundedVolSize = datasets[0].volsize.parsed;

      if (datasets[0].volsize.parsed % volblocksizeIntegerValue !== 0) {
        roundedVolSize = datasets[0].volsize.parsed
          + (volblocksizeIntegerValue - datasets[0].volsize.parsed % volblocksizeIntegerValue);
      }

      if (data.volsize && data.volsize < roundedVolSize) {
        canSubmit = false;
      }
    }

    return { payload: data as DatasetUpdate, canSubmit };
  }

  private setupForm(): void {
    if (!this.isNew) {
      this.disableEncryptionFields();
      this.form.controls.name.disable();
    }

    this.setupLoading.set(true);
    forkJoin([
      this.api.call('pool.dataset.query', [[['id', '=', this.parentOrZvolId]]]),
      this.loadRecommendedBlocksize(),
      this.api.call('pool.dataset.compression_choices').pipe(choicesToOptions()),
    ])
      .pipe(
        finalize(() => this.setupLoading.set(false)),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: ([parents, , compressionOptions]) => {
          this.compressionOptions = compressionOptions;
          const parentOrZvol = parents[0];
          if (parentOrZvol.encrypted) {
            this.form.controls.encryption.setValue(true);
            this.form.controls.encryption.disable();
          }

          this.addNameValidator(parentOrZvol);

          this.inheritEncryptionProperties(parentOrZvol);

          this.addMinimumBlocksizeWarning();

          if (parentOrZvol?.type === DatasetType.Filesystem) {
            this.setReadonlyField(parentOrZvol, parentOrZvol);
            this.inheritFileSystemProperties(parentOrZvol);
            if (!this.isNew) {
              this.formSnapshot.set(this.form.getRawValue());
            }
          } else {
            let parentDatasetId: string | string[] = parentOrZvol.name.split('/');
            parentDatasetId.pop();
            parentDatasetId = parentDatasetId.join('/');

            this.api.call('pool.dataset.query', [[['id', '=', parentDatasetId]]]).pipe(
              this.errorHandler.withErrorHandler(),
              takeUntilDestroyed(this.destroyRef),
            ).subscribe({
              next: (parentDataset) => {
                this.form.controls.sparse.disable();
                this.form.controls.volblocksize.disable();

                this.setReadonlyField(parentOrZvol, parentDataset[0]);
                this.copyParentProperties(parentOrZvol);
                this.inheritSyncSource(parentOrZvol, parentDataset);
                this.inheritCompression(parentOrZvol, parentDataset);
                this.inheritDeduplication(parentOrZvol, parentDataset);
                this.inheritSnapdev(parentOrZvol, parentDataset);
                this.inheritSpecialSmallBlockSize(parentDataset);

                if (!this.isNew) {
                  this.formSnapshot.set(this.form.getRawValue());
                }

                this.cdr.markForCheck();
              },
            });
          }
          this.cdr.markForCheck();
        },
      });
  }

  private addNameValidator(parent: Dataset): void {
    const isCaseInsensitive = parent.casesensitivity?.value !== DatasetCaseSensitivity.Sensitive;
    const namesInUse = (parent.children?.map((child) => {
      return /[^/]*$/.exec(child.name)?.[0];
    }) || []).filter((name): name is string => name !== undefined);

    this.form.controls.name.addValidators([
      datasetNameTooLong(parent.name),
      forbiddenValues(namesInUse, isCaseInsensitive),
    ]);
  }

  private copyParentProperties(parent: Dataset): void {
    this.form.controls.name.setValue(parent.name);
    const comments = getUserProperty<string>(parent, 'comments');
    this.form.controls.comments.setValue(comments?.value || '');

    // Store original volsize to avoid precision loss from formatting/parsing
    this.originalVolsize = parent.volsize.parsed;
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
        this.form.controls.special_small_block_size.setValue(OnOff.Off);
      } else if (specialSmallBlockSize > 0) {
        // Any value > 0 means ON
        this.form.controls.special_small_block_size.setValue(OnOff.On);
        this.form.controls.special_small_block_size_custom.setValue(specialSmallBlockSize);
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
      if (sizeInBytes === 0) {
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

  private inheritSpecialSmallBlockSize(parentDataset: Dataset[]): void {
    const inheritLabel = this.translate.instant('Inherit');
    if (parentDataset[0].special_small_block_size) {
      const sizeInBytes = this.formatter.convertHumanStringToNum(parentDataset[0].special_small_block_size.value);
      let inheritLabelValue: string;
      if (sizeInBytes === 0) {
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
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((inheritEncryption) => {
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
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((encryption: boolean) => {
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
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type: 'key' | 'passphrase') => {
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
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((generateKey: boolean) => {
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

  private loadRecommendedBlocksize(): Observable<unknown> {
    const root = this.parentOrZvolId.split('/')[0];

    return this.api.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(
      tap((recommendedSize) => {
        this.form.controls.volblocksize.setValue(recommendedSize);
        this.minimumRecommendedBlockSize = recommendedSize;
      }),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private addMinimumBlocksizeWarning(): void {
    this.form.controls.volblocksize.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((recordSize: DatasetRecordSize) => {
        const currentSize = this.formatter.convertHumanStringToNum(recordSize);
        const minimumRecommendedSize = this.formatter.convertHumanStringToNum(this.minimumRecommendedBlockSize);
        if (!currentSize || !minimumRecommendedSize || currentSize >= minimumRecommendedSize) {
          this.volBlockSizeWarning = null;
          return;
        }

        this.volBlockSizeWarning = `${this.translate.instant(helptextZvol.blocksizeWarning.a)} ${this.minimumRecommendedBlockSize}. ${this.translate.instant(helptextZvol.blocksizeWarning.b)}`;
      });
  }

  private setReadonlyField(zvol: Dataset, parentDataset: Dataset): void {
    // Store the effective readonly value when inherit is selected (from parent)
    this.inheritedReadonlyValue = parentDataset.readonly.value;

    this.readonlyOptions.unshift({
      label: `${this.translate.instant('Inherit')} (${parentDataset.readonly.rawvalue})`,
      value: inherit,
    });

    let readonlyValue;
    if (this.isNew) {
      readonlyValue = inherit;
    } else {
      readonlyValue = zvol.readonly.value;
      if (
        zvol.readonly.source === ZfsPropertySource.Default
        || zvol.readonly.source === ZfsPropertySource.Inherited
      ) {
        readonlyValue = inherit;
      }
    }
    this.form.controls.readonly.setValue(readonlyValue);

    if (!this.isNew) {
      this.originalReadonlyValue = readonlyValue;
      this.updateVolsizeStateBasedOnReadonly(readonlyValue);

      this.form.controls.readonly.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
        this.updateVolsizeStateBasedOnReadonly(value);
      });
    }
  }

  private updateVolsizeStateBasedOnReadonly(readonlyValue: string): void {
    const effectiveCurrentValue = this.getEffectiveReadonlyValue(readonlyValue);
    const effectiveOriginalValue = this.getEffectiveReadonlyValue(this.originalReadonlyValue);

    const isEffectivelyReadonlyOn = effectiveCurrentValue === OnOff.On as string;
    const hasEffectivelyChanged = effectiveCurrentValue !== effectiveOriginalValue;

    if (isEffectivelyReadonlyOn || hasEffectivelyChanged) {
      this.form.controls.volsize.disable();
    } else {
      this.form.controls.volsize.enable();
    }

    this.volsizeReadonlyWarning = hasEffectivelyChanged
      ? this.translate.instant(helptextZvol.readonlyVolsizeWarning)
      : null;
  }

  private getEffectiveReadonlyValue(readonlyValue: string): string {
    return readonlyValue === inherit ? this.inheritedReadonlyValue : readonlyValue;
  }

  private alignVolsizeToBlocksize(volsize: number, blocksize: number): number {
    if (volsize % blocksize !== 0) {
      return volsize + (blocksize - volsize % blocksize);
    }
    return volsize;
  }
}
