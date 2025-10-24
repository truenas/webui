import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges, OnInit, output, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, Observable, of, take,
} from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  specialVdevDefaultThreshold,
  specialVdevDisableThreshold,
  specialVdevMaxThreshold,
  specialVdevMinThreshold,
} from 'app/constants/dataset.constants';
import { AclMode, aclModeLabels } from 'app/enums/acl-type.enum';
import {
  DatasetAclType,
  DatasetCaseSensitivity,
  datasetCaseSensitivityLabels,
  DatasetChecksum,
  DatasetPreset,
  DatasetRecordSize,
  DatasetSnapdev,
  datasetSnapdevLabels,
  DatasetSnapdir,
  datasetSnapdirLabels,
  DatasetSync,
  datasetSyncLabels,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting, deduplicationSettingLabels } from 'app/enums/deduplication-setting.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { OnOff, onOffLabels } from 'app/enums/on-off.enum';
import { inherit, WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { getFieldValue } from 'app/pages/datasets/components/dataset-form/utils/zfs-property.utils';
import { getUserProperty, transformSpecialSmallBlockSizeForPayload } from 'app/pages/datasets/utils/dataset.utils';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsEnterprise, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-other-options-section',
  styleUrls: ['./other-options-section.component.scss'],
  templateUrl: './other-options-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFieldsetComponent,
    IxInputComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxSelectComponent,
    WarningComponent,
    FileSizePipe,
  ],
})
export class OtherOptionsSectionComponent implements OnInit, OnChanges {
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private cdr = inject(ChangeDetectorRef);
  private systemGeneralService = inject(SystemGeneralService);
  private dialogService = inject(DialogService);
  protected formatter = inject(IxFormatterService);
  private api = inject(ApiService);
  private datasetFormService = inject(DatasetFormService);

  readonly parent = input<Dataset>();
  readonly existing = input<Dataset>();
  readonly datasetPreset = input<DatasetPreset>();
  readonly advancedMode = input<boolean>();

  readonly advancedModeChange = output();
  readonly formValidityChange = output<boolean>();

  hasDeduplication = false;
  hasRecordsizeWarning = false;
  wasDedupChecksumWarningShown = false;
  minimumRecommendedRecordsize = '128K' as DatasetRecordSize;

  readonly form = this.formBuilder.group({
    comments: [''],
    sync: [inherit as WithInherit<DatasetSync>],
    compression: [inherit as WithInherit<string>],
    atime: [inherit as WithInherit<OnOff>],
    deduplication: [inherit as WithInherit<DeduplicationSetting>],
    checksum: [inherit as WithInherit<DatasetChecksum>],
    readonly: [inherit as WithInherit<OnOff>],
    exec: [inherit as WithInherit<OnOff>],
    snapdir: [null as WithInherit<DatasetSnapdir> | null],
    snapdev: [inherit as WithInherit<DatasetSnapdev>],
    copies: [1 as number | null],
    recordsize: [inherit as string],
    acltype: [DatasetAclType.Inherit as DatasetAclType],
    aclmode: [AclMode.Inherit as AclMode],
    casesensitivity: [DatasetCaseSensitivity.Sensitive as DatasetCaseSensitivity],
    special_small_block_size: [inherit as WithInherit<'ON' | 'OFF'>],
    special_small_block_size_custom: [null as number | null],
  });

  showCustomizeSpecialSmallBlockSize = false;

  syncOptions$: Observable<Option[]>;
  compressionOptions$: Observable<Option[]>;
  atimeOptions$: Observable<Option[]>;
  deduplicationOptions$: Observable<Option[]>;
  checksumOptions$: Observable<Option[]>;
  readonlyOptions$: Observable<Option[]>;
  execOptions$: Observable<Option[]>;
  snapdirOptions$ = of(mapToOptions(datasetSnapdirLabels, this.translate));
  snapdevOptions$: Observable<Option[]>;
  copiesOptions$ = of([
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
  ]);

  recordsizeOptions$: Observable<Option[]>;
  caseSensitivityOptions$ = of(mapToOptions(datasetCaseSensitivityLabels, this.translate));
  aclTypeOptions$ = of([
    { label: this.translate.instant('Inherit'), value: DatasetAclType.Inherit },
    { label: this.translate.instant('Off'), value: DatasetAclType.Off },
    { label: this.translate.instant('SMB/NFSv4'), value: DatasetAclType.Nfsv4 },
    { label: this.translate.instant('POSIX'), value: DatasetAclType.Posix },
  ]);

  aclModeOptions$ = of(mapToOptions(aclModeLabels, this.translate));
  specialSmallBlockSizeOptions$: Observable<Option[]>;

  private readonly defaultSyncOptions$ = of(mapToOptions(datasetSyncLabels, this.translate));
  private readonly defaultSpecialSmallBlockSizeOptions$ = of([
    { label: this.translate.instant('On'), value: 'ON' },
    { label: this.translate.instant('Off'), value: 'OFF' },
  ]);

  private readonly defaultCompressionOptions$ = this.api.call('pool.dataset.compression_choices').pipe(choicesToOptions());
  private readonly defaultAtimeOptions$ = of(mapToOptions(onOffLabels, this.translate));
  private defaultDeduplicationOptions$ = of(mapToOptions(deduplicationSettingLabels, this.translate));
  private defaultChecksumOptions$ = this.api.call('pool.dataset.checksum_choices').pipe(
    choicesToOptions(),
  );

  private onOffOptions$ = of(mapToOptions(onOffLabels, this.translate));
  private defaultSnapdevOptions$ = of(mapToOptions(datasetSnapdevLabels, this.translate));
  private defaultRecordSizeOptions$ = this.api.call('pool.dataset.recordsize_choices').pipe(
    singleArrayToOptions(),
  );

  readonly helptext = helptextDatasetForm;

  get hasChecksumWarning(): boolean {
    return this.form.value.checksum === DatasetChecksum.Sha256
      && this.form.value.deduplication !== DeduplicationSetting.Off;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.datasetPreset?.currentValue) {
      this.setUpDatasetPresetSelect();
    }

    if (!changes.existing?.currentValue && !changes.parent?.currentValue) {
      return;
    }

    this.setUpRecordsizeWarning();
    this.setSelectOptions();

    this.setFormValues();

    this.checkDedupChecksum();
    this.setUpDedupWarning();
    this.setUpAclTypeWarning();
    this.updateAclMode();
    this.disableCaseSensitivityOnEdit();
    this.listenForSyncChanges();
  }

  ngOnInit(): void {
    this.checkIfDedupIsSupported();

    this.form.controls.acltype.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateAclMode();
    });

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

    this.form.statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
      this.formValidityChange.emit(status === 'VALID');
    });
  }

  getPayload(): Partial<DatasetCreate> | Partial<DatasetUpdate> {
    const values = this.form.value;

    // Build payload from form values - using Record type to allow transformation of UI types to API types
    const payload: Record<string, unknown> = {
      ...values,
      checksum: values.checksum as DatasetChecksum,
      copies: values.copies || 1,
    };

    // Handle special_small_block_size transformation
    payload.special_small_block_size = transformSpecialSmallBlockSizeForPayload(
      values.special_small_block_size,
      values.special_small_block_size_custom,
    );

    // Remove UI-only field
    delete payload.special_small_block_size_custom;

    if (values.acltype && [DatasetAclType.Posix, DatasetAclType.Off].includes(values.acltype)) {
      payload.aclmode = AclMode.Discard;
    } else if (values.acltype === DatasetAclType.Inherit) {
      payload.aclmode = AclMode.Inherit;
    }

    if (!values.snapdir) {
      delete payload.snapdir;
    }

    return payload as Partial<DatasetCreate> | Partial<DatasetUpdate>;
  }

  toggleCustomizeSpecialSmallBlockSize(): void {
    this.showCustomizeSpecialSmallBlockSize = !this.showCustomizeSpecialSmallBlockSize;
    if (this.showCustomizeSpecialSmallBlockSize && !this.form.value.special_small_block_size_custom) {
      // Set a sensible default when opening customize (128 KiB)
      this.form.patchValue({ special_small_block_size_custom: specialVdevDefaultThreshold });
    }
    this.cdr.markForCheck();
  }

  private checkIfDedupIsSupported(): void {
    this.hasDeduplication = false;
    this.cdr.markForCheck();

    combineLatest([
      this.store$.select(selectIsEnterprise),
      this.store$.pipe(waitForSystemInfo),
    ]).pipe(untilDestroyed(this)).subscribe(([isEnterprise, systemInfo]) => {
      if (!isEnterprise) {
        this.hasDeduplication = true;
        this.cdr.markForCheck();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (systemInfo.license && systemInfo.license.features.includes(LicenseFeature.Dedup)) {
        this.hasDeduplication = true;
        this.cdr.markForCheck();
      }
    });
  }

  private setFormValues(): void {
    const existing = this.existing();
    if (!existing) {
      return;
    }

    // Check if special_small_block_size is inherited or locally set
    const isInherited = !existing.special_small_block_size
      || existing.special_small_block_size.source === ZfsPropertySource.Inherited
      || existing.special_small_block_size.source === ZfsPropertySource.Default;

    let specialSmallBlockSizeValue: WithInherit<'ON' | 'OFF'> = inherit;
    let customValue: number | null = null;

    if (!isInherited && existing.special_small_block_size) {
      const sizeInBytes = this.formatter.convertHumanStringToNum(existing.special_small_block_size.value);

      if (sizeInBytes === 0) {
        // 0 means OFF (disabled)
        specialSmallBlockSizeValue = 'OFF';
      } else if (sizeInBytes > 0 && sizeInBytes < specialVdevDisableThreshold) {
        // Between 0 and 16 MiB means ON with custom value
        specialSmallBlockSizeValue = 'ON';
        customValue = sizeInBytes;
        this.showCustomizeSpecialSmallBlockSize = true;
      } else {
        // 16 MiB or larger also means OFF (legacy values)
        specialSmallBlockSizeValue = 'OFF';
      }
    }

    const comments = getUserProperty<string>(existing, 'comments');
    this.form.patchValue({
      comments: comments?.source === ZfsPropertySource.Local ? comments.value : '',
      sync: getFieldValue(existing.sync, this.parent()),
      compression: getFieldValue(existing.compression, this.parent()),
      atime: getFieldValue(existing.atime, this.parent()),
      deduplication: getFieldValue(existing.deduplication, this.parent()),
      checksum: getFieldValue(existing.checksum, this.parent()),
      readonly: getFieldValue(existing.readonly, this.parent()),
      exec: getFieldValue(existing.exec, this.parent()),
      recordsize: getFieldValue(existing.recordsize, this.parent()),
      snapdir: existing.snapdir?.value,
      snapdev: getFieldValue(existing.snapdev, this.parent()),
      copies: existing.copies
        ? Number(existing.copies.value)
        : null,
      acltype: getFieldValue(existing.acltype, this.parent()) as DatasetAclType,
      aclmode: getFieldValue(existing.aclmode, this.parent()) as AclMode,
      casesensitivity: existing.casesensitivity?.value,
      special_small_block_size: specialSmallBlockSizeValue,
      special_small_block_size_custom: customValue,
    });
  }

  private updateAclMode(): void {
    const aclModeControl = this.form.controls.aclmode;
    const aclTypeControl = this.form.controls.acltype;

    const invalidPosixOrOffAclType = (aclTypeControl.value === DatasetAclType.Posix
      || aclTypeControl.value === DatasetAclType.Off) && aclModeControl.value !== AclMode.Discard;

    const invalidInheritAclType = aclTypeControl.value === DatasetAclType.Inherit
      && aclModeControl.value !== AclMode.Inherit;

    if (!!this.existing() && (invalidPosixOrOffAclType || invalidInheritAclType) && !aclTypeControl.touched) {
      return;
    }

    if (!this.parent()) {
      aclModeControl.disable({ emitEvent: false });
      aclTypeControl.disable({ emitEvent: false });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (aclTypeControl.value) {
      case DatasetAclType.Nfsv4:
        if (!this.existing()) {
          aclModeControl.setValue(AclMode.Passthrough);
        }
        aclModeControl.enable();
        break;
      case DatasetAclType.Posix:
      case DatasetAclType.Off:
        aclModeControl.setValue(AclMode.Discard);
        aclModeControl.disable();
        break;
      case DatasetAclType.Inherit:
        aclModeControl.setValue(AclMode.Inherit);
        aclModeControl.disable();
        break;
    }
  }

  private setSelectOptions(): void {
    const parent = this.parent();
    if (!parent) {
      this.syncOptions$ = this.defaultSyncOptions$;
      this.compressionOptions$ = this.defaultCompressionOptions$;
      this.atimeOptions$ = this.defaultAtimeOptions$;
      this.deduplicationOptions$ = this.defaultDeduplicationOptions$;
      this.checksumOptions$ = this.defaultChecksumOptions$;
      this.readonlyOptions$ = this.onOffOptions$;
      this.execOptions$ = this.onOffOptions$;
      this.snapdevOptions$ = this.defaultSnapdevOptions$;
      this.recordsizeOptions$ = this.defaultRecordSizeOptions$;
      this.specialSmallBlockSizeOptions$ = this.defaultSpecialSmallBlockSizeOptions$;

      return;
    }

    this.syncOptions$ = this.defaultSyncOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.sync.value),
    );
    this.compressionOptions$ = this.defaultCompressionOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.compression.value),
    );
    this.atimeOptions$ = this.defaultAtimeOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.atime.value),
    );
    this.deduplicationOptions$ = this.defaultDeduplicationOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.deduplication.value),
    );
    this.checksumOptions$ = this.defaultChecksumOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.checksum.value),
    );
    this.readonlyOptions$ = this.onOffOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.readonly.value),
    );
    this.execOptions$ = this.onOffOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.exec.value),
    );
    this.snapdevOptions$ = this.defaultSnapdevOptions$.pipe(
      this.datasetFormService.addInheritOption(parent.snapdev.value),
    );

    this.recordsizeOptions$ = this.defaultRecordSizeOptions$.pipe(
      this.datasetFormService.addInheritOption(
        buildNormalizedFileSize(parent.recordsize.parsed),
      ),
    );

    // Build inherit label for special_small_block_size
    let inheritLabel = 'Inherit';
    if (parent.special_small_block_size?.value) {
      const sizeInBytes = this.formatter.convertHumanStringToNum(parent.special_small_block_size.value);
      if (sizeInBytes === 0 || sizeInBytes >= specialVdevDisableThreshold) {
        // 0 or >= 16 MiB means OFF
        inheritLabel = 'Inherit (off)';
      } else if (sizeInBytes > 0) {
        // Format as human-readable size (e.g., "128 KiB" instead of "128K")
        const formattedSize = buildNormalizedFileSize(sizeInBytes);
        inheritLabel = `Inherit (${formattedSize})`;
      }
    }

    this.specialSmallBlockSizeOptions$ = this.defaultSpecialSmallBlockSizeOptions$.pipe(
      map((options) => [{ label: inheritLabel, value: inherit }, ...options]),
    );
  }

  private setUpDatasetPresetSelect(): void {
    if (!this.datasetPreset() || this.existing()) {
      return;
    }

    if (this.datasetPreset() === DatasetPreset.Smb) {
      this.form.patchValue({
        aclmode: AclMode.Restricted,
        casesensitivity: DatasetCaseSensitivity.Insensitive,
      });
      this.form.controls.aclmode.disable();
      this.form.controls.casesensitivity.disable();
    } else {
      this.form.patchValue({
        aclmode: AclMode.Passthrough,
        casesensitivity: DatasetCaseSensitivity.Sensitive,
      });
      this.form.controls.aclmode.enable();
      this.form.controls.casesensitivity.enable();
    }
  }

  private setUpDedupWarning(): void {
    this.form.controls.deduplication.valueChanges.pipe(untilDestroyed(this)).subscribe((dedup) => {
      if (!dedup || [DeduplicationSetting.Off, inherit].includes(dedup)) {
        this.cdr.markForCheck();
        return;
      }

      this.dialogService.confirm({
        title: this.translate.instant('Warning'),
        message: this.translate.instant(helptextDatasetForm.deduplicationWarning),
        hideCheckbox: true,
      })
        .pipe(untilDestroyed(this))
        .subscribe((confirmed) => {
          if (confirmed) {
            this.checkDedupChecksum();
          } else {
            this.form.patchValue({
              deduplication: inherit,
            });
          }
        });
    });
  }

  private checkDedupChecksum(): void {
    const dedup = this.form.controls.deduplication.value;
    if (!dedup || [DeduplicationSetting.Off, inherit].includes(dedup)) {
      return;
    }

    const checksum = this.form.controls.checksum.value;
    if (
      this.wasDedupChecksumWarningShown
      || !checksum
      || checksum === DatasetChecksum.Sha512
      || checksum !== DatasetChecksum.Sha256
    ) {
      return;
    }

    this.showDedupChecksumWarning();
    this.form.patchValue({
      checksum: DatasetChecksum.Sha512,
    });
  }

  private setUpAclTypeWarning(): void {
    this.form.controls.acltype.valueChanges
      .pipe(take(1), untilDestroyed(this))
      .subscribe(() => {
        this.dialogService.warn(
          this.translate.instant('ACL Types & ACL Modes'),
          helptextDatasetForm.aclTypeChangeWarning,
        );
      });
  }

  private showDedupChecksumWarning(): void {
    this.wasDedupChecksumWarningShown = true;
    this.dialogService.confirm({
      hideCancel: true,
      title: this.translate.instant('Default Checksum Warning'),
      hideCheckbox: true,
      message: this.translate.instant(helptextDatasetForm.deduplicationChecksumWarning),
      buttonText: this.translate.instant('OK'),
    });
  }

  private disableCaseSensitivityOnEdit(): void {
    if (!this.existing()) {
      return;
    }

    this.form.controls.casesensitivity.disable();
  }

  private setUpRecordsizeWarning(): void {
    const parent = this.parent();
    if (!parent) {
      return;
    }

    const root = parent.id.split('/')[0];
    combineLatest([
      this.form.controls.recordsize.valueChanges.pipe(startWith(this.form.controls.recordsize.value)),
      this.api.call('pool.dataset.recommended_zvol_blocksize', [root]),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([recordsizeValue, recommendedAsString]) => {
        const recordsizeAsString = recordsizeValue === '512' ? '512B' : recordsizeValue;
        const recordsize = this.formatter.memorySizeParsing(recordsizeAsString);
        const recommended = this.formatter.memorySizeParsing(recommendedAsString);

        this.hasRecordsizeWarning = Boolean(recordsize
          && !!recommended
          && recordsizeAsString !== inherit
          && recordsize < recommended);

        this.minimumRecommendedRecordsize = recommendedAsString;

        if (this.hasRecordsizeWarning) {
          this.advancedModeChange.emit();
        }
        this.cdr.markForCheck();
      });
  }

  private listenForSyncChanges(): void {
    this.form.controls.sync.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value === DatasetSync.Disabled && this.form.controls.sync.dirty) {
        this.dialogService.confirm({
          title: this.translate.instant('Warning'),
          message: this.translate.instant(helptextDatasetForm.disabledSyncWarning),
          buttonText: this.translate.instant('Okay'),
          hideCheckbox: true,
          hideCancel: true,
        });
      }
    });
  }
}
