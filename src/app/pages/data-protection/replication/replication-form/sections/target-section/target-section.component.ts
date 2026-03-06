import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnChanges, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent } from '@truenas/ui-components';
import { forkJoin, merge, Observable, of } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { EncryptionKeyFormat, encryptionKeyFormatNames } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit, lifetimeUnitNames } from 'app/enums/lifetime-unit.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ReadOnlyMode, readonlyModeNames } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy, retentionPolicyNames } from 'app/enums/retention-policy.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextReplication } from 'app/helptext/data-protection/replication/replication';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { exactLength } from 'app/modules/forms/ix-forms/validators/validators';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TargetDatasetInfo, extractTargetEncryptionInfo, getEncryptionErrors,
} from 'app/pages/data-protection/replication/replication-encryption-validator';
import { ReplicationService } from 'app/services/replication.service';

@Component({
  selector: 'ix-replication-target-section',
  styleUrls: ['./target-section.component.scss'],
  templateUrl: './target-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    TranslateModule,
    TnBannerComponent,
  ],
})
export class TargetSectionComponent implements OnInit, OnChanges {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private replicationService = inject(ReplicationService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly replication = input<ReplicationTask>();
  readonly allowsCustomRetentionPolicy = input(false);
  readonly sourceEncryptedWithPreservedProperties = input(false);
  readonly isLocalTarget = input(false);
  readonly nodeProvider = input<TreeNodeProvider>();

  form = this.formBuilder.nonNullable.group({
    target_dataset: [null as string | null, Validators.required],
    readonly: [ReadOnlyMode.Require],
    encryption: [false],
    encryption_inherit: [false],
    encryption_key_format: [EncryptionKeyFormat.Hex, [Validators.required]],
    encryption_key_generate: [true],
    encryption_key_hex: ['', [exactLength(64)]],
    encryption_key_passphrase: ['', [Validators.required, Validators.minLength(8)]],
    encryption_key_location_truenasdb: [true],
    encryption_key_location: [''],
    allow_from_scratch: [false],
    retention_policy: [RetentionPolicy.None],
    lifetime_value: [null as number | null, [Validators.required]],
    lifetime_unit: [LifetimeUnit.Week, [Validators.required]],
  });

  protected readonly emptyRootNode = [emptyRootNode];

  retentionPolicies$: Observable<Option[]>;

  readonly readonlyModes$ = of(mapToOptions(readonlyModeNames, this.translate));
  readonly encryptionKeyFormats$ = of(mapToOptions(encryptionKeyFormatNames, this.translate));
  readonly lifetimeUnits$ = of(mapToOptions(lifetimeUnitNames, this.translate));

  protected readonly RetentionPolicy = RetentionPolicy;

  protected readonly helptext = helptextReplication;
  readonly validatingTarget = signal(false);

  readonly readonlyWarning = signal('');

  private allRetentionPolicies$ = of(mapToOptions(retentionPolicyNames, this.translate));

  get hasEncryption(): boolean {
    return Boolean(this.form.value.encryption);
  }

  get hasEncryptionInherit(): boolean {
    return Boolean(this.form.value.encryption_inherit);
  }

  get isHex(): boolean {
    return this.form.controls.encryption_key_format.value === EncryptionKeyFormat.Hex;
  }

  private formValuesApplied = false;

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('replication' in changes) {
      const replication = this.replication();
      if (replication && !this.formValuesApplied) {
        this.formValuesApplied = true;
        this.setFormValues(replication);
      }
    }

    if ('nodeProvider' in changes) {
      if (this.nodeProvider()) {
        this.form.controls.target_dataset.enable({ emitEvent: false });
      } else {
        this.form.controls.target_dataset.disable({ emitEvent: false });
      }
    }

    if ('sourceEncryptedWithPreservedProperties' in changes) {
      if (this.sourceEncryptedWithPreservedProperties()) {
        this.form.controls.encryption.setValue(false, { emitEvent: false });
        this.form.controls.encryption.disable({ emitEvent: false });
      } else {
        this.form.controls.encryption.enable({ emitEvent: false });
      }
      this.updateEncryptionFields();
      this.validateTargetDataset();
    }

    if ('isLocalTarget' in changes) {
      if (this.isLocalTarget() && this.form.controls.target_dataset.value) {
        // Trigger re-fetch of target dataset info for local validation.
        this.form.controls.target_dataset.updateValueAndValidity();
      } else {
        this.validateTargetDataset();
      }
    }

    if ('allowsCustomRetentionPolicy' in changes) {
      this.setRetentionPolicyOptions();
    }
  }

  ngOnInit(): void {
    this.setRetentionPolicyOptions();

    this.form.controls.lifetime_value.disable();
    this.form.controls.lifetime_unit.disable();

    this.form.controls.retention_policy.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((retentionPolicy) => {
      if (retentionPolicy === RetentionPolicy.Custom) {
        this.form.controls.lifetime_value.enable();
        this.form.controls.lifetime_unit.enable();
      } else {
        this.form.controls.lifetime_value.disable();
        this.form.controls.lifetime_unit.disable();
      }
    });

    if (this.form.controls.retention_policy.value === RetentionPolicy.Custom) {
      this.form.controls.lifetime_value.enable();
      this.form.controls.lifetime_unit.enable();
    }

    this.form.controls.encryption_key_format.disable();
    this.form.controls.encryption_key_passphrase.disable();
    this.form.controls.encryption_key_hex.disable();

    this.form.controls.encryption.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.updateEncryptionFields());

    this.form.controls.encryption_inherit.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.updateEncryptionFields());

    this.form.controls.encryption_key_format.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.updateEncryptionFields());

    this.updateEncryptionFields();
    this.listenForTargetDatasetValidation();
  }

  private updateEncryptionFields(): void {
    const encryption = this.form.controls.encryption.value;
    const encryptionInherit = this.form.controls.encryption_inherit.value;

    if (encryption && !encryptionInherit) {
      this.form.controls.encryption_key_format.enable({ emitEvent: false });
      if (this.isHex) {
        this.form.controls.encryption_key_passphrase.disable({ emitEvent: false });
        this.form.controls.encryption_key_hex.enable({ emitEvent: false });
      } else {
        this.form.controls.encryption_key_passphrase.enable({ emitEvent: false });
        this.form.controls.encryption_key_hex.disable({ emitEvent: false });
      }
    } else {
      this.form.controls.encryption_key_format.disable({ emitEvent: false });
      this.form.controls.encryption_key_passphrase.disable({ emitEvent: false });
      this.form.controls.encryption_key_hex.disable({ emitEvent: false });
    }
  }

  getPayload(): Partial<ReplicationCreate> {
    const values = this.form.getRawValue();
    const payload: Partial<ReplicationCreate> = {
      target_dataset: values.target_dataset || undefined,
      readonly: values.readonly,
      encryption: values.encryption,
      allow_from_scratch: values.allow_from_scratch,
      retention_policy: values.retention_policy,
    };

    if (values.encryption) {
      payload.encryption_inherit = values.encryption_inherit;
    }

    if (values.encryption && !values.encryption_inherit) {
      payload.encryption_key_format = values.encryption_key_format;
      payload.encryption_key_location = values.encryption_key_location_truenasdb
        ? truenasDbKeyLocation
        : values.encryption_key_location;

      if (this.isHex) {
        // encryption_key_generate and encryption_key_hex have no UI in the template.
        // On edit, setFormValues() sets encryption_key_generate=false and loads the existing key
        // into encryption_key_hex, preserving the original key. For new tasks, the default
        // encryption_key_generate=true causes a fresh key to be generated.
        payload.encryption_key = values.encryption_key_generate
          ? this.replicationService.generateEncryptionHexKey(64)
          : values.encryption_key_hex;
      } else {
        payload.encryption_key = values.encryption_key_passphrase;
      }
    }

    if (values.retention_policy === RetentionPolicy.Custom) {
      payload.lifetime_value = values.lifetime_value;
      payload.lifetime_unit = values.lifetime_unit;
    } else {
      payload.lifetime_value = null;
      payload.lifetime_unit = null;
    }

    return payload;
  }

  private setFormValues(replication: ReplicationTask): void {
    const usesTruenasKeyDb = replication.encryption_key_location === truenasDbKeyLocation;

    this.form.patchValue({
      ...replication,
      encryption_key_location_truenasdb: usesTruenasKeyDb || !replication.encryption,
      encryption_key_location: usesTruenasKeyDb ? '' : (replication.encryption_key_location || ''),
    });

    if (this.isHex) {
      this.form.patchValue({
        encryption_key_passphrase: '',
        encryption_key_hex: replication.encryption_key || '',
        encryption_key_generate: false,
      });
    } else {
      this.form.patchValue({
        encryption_key_passphrase: replication.encryption_key || '',
        encryption_key_hex: '',
      });
    }
  }

  private lastTargetDataset: TargetDatasetInfo | null = null;

  private listenForTargetDatasetValidation(): void {
    this.form.controls.target_dataset.valueChanges.pipe(
      startWith(this.form.controls.target_dataset.value),
      debounceTime(300),
      switchMap((targetDataset) => {
        if (!targetDataset || !this.isLocalTarget()) {
          this.validatingTarget.set(false);
          return of(null);
        }
        this.validatingTarget.set(true);
        this.cdr.markForCheck();
        return forkJoin([
          this.api.call('pool.dataset.query', [
            [['id', '=', targetDataset]],
          ]),
          this.api.call('pool.dataset.query', [
            [['id', '^', targetDataset + '/']],
            { select: ['id'], offset: 0, limit: 1 },
          ]),
        ]).pipe(
          map(([datasets, children]) => {
            if (!datasets.length) return null;
            return { dataset: datasets[0], hasChildren: children.length > 0 };
          }),
          catchError(() => of(null)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result: { dataset: Dataset; hasChildren: boolean } | null) => {
      this.validatingTarget.set(false);
      if (result) {
        this.lastTargetDataset = {
          ...extractTargetEncryptionInfo(result.dataset),
          readonlyValue: result.dataset.readonly.value,
          hasChildren: result.hasChildren,
        };
      } else {
        this.lastTargetDataset = null;
      }
      this.validateTargetDataset();
    });

    merge(
      this.form.controls.encryption.valueChanges,
      this.form.controls.readonly.valueChanges,
      this.form.controls.allow_from_scratch.valueChanges,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.validateTargetDataset();
    });
  }

  private validateTargetDataset(): void {
    if (!this.lastTargetDataset || !this.isLocalTarget()) {
      this.form.controls.encryption.setErrors(null);
      this.form.controls.allow_from_scratch.setErrors(null);
      // Still call validateReadonlyPolicy — for remote targets it sets the warning banner.
      this.validateReadonlyPolicy();
      this.cdr.markForCheck();
      return;
    }

    if (this.form.controls.encryption.disabled) {
      this.form.controls.encryption.setErrors(null);
    } else {
      const encryptionEnabled = this.form.controls.encryption.value;
      this.form.controls.encryption.setErrors(
        getEncryptionErrors(this.lastTargetDataset, encryptionEnabled, this.translate),
      );
    }

    this.validateReadonlyPolicy();

    const allowFromScratch = this.form.controls.allow_from_scratch.value;
    if (!allowFromScratch && this.lastTargetDataset.hasChildren) {
      this.form.controls.allow_from_scratch.setErrors({
        [ixManualValidateError]: {
          removable: false,
          message: this.translate.instant('Destination dataset already has data. "Replication from scratch" must be enabled to overwrite existing data.'),
        },
      });
    } else {
      this.form.controls.allow_from_scratch.setErrors(null);
    }

    this.cdr.markForCheck();
  }

  private validateReadonlyPolicy(): void {
    const readonlyMode = this.form.controls.readonly.value;

    if (readonlyMode !== ReadOnlyMode.Require) {
      this.form.controls.readonly.setErrors(null);
      this.readonlyWarning.set('');
      return;
    }

    // For local targets, check the actual readonly property
    if (this.lastTargetDataset && this.isLocalTarget()) {
      if (this.lastTargetDataset.readonlyValue !== OnOff.On) {
        this.form.controls.readonly.setErrors({
          [ixManualValidateError]: {
            removable: false,
            message: this.translate.instant('Destination dataset does not have the readonly property enabled. The REQUIRE read-only policy will cause replication to fail.'),
          },
        });
      } else {
        this.form.controls.readonly.setErrors(null);
      }
      this.readonlyWarning.set('');
      return;
    }

    this.form.controls.readonly.setErrors(null);

    // For remote targets, show a non-blocking warning
    this.readonlyWarning.set(this.isLocalTarget()
      ? ''
      : this.translate.instant(
          'REQUIRE policy requires the destination dataset to have the readonly property enabled. Ensure the remote destination dataset has readonly=on or the replication will fail.',
        ));
  }

  private setRetentionPolicyOptions(): void {
    if (this.allowsCustomRetentionPolicy()) {
      this.retentionPolicies$ = this.allRetentionPolicies$;
      return;
    }

    this.retentionPolicies$ = this.allRetentionPolicies$.pipe(
      map((options) => options.filter((option) => option.value !== RetentionPolicy.Custom)),
    );

    if (this.form.value.retention_policy === RetentionPolicy.Custom) {
      this.form.patchValue({ retention_policy: RetentionPolicy.None });
    }
  }
}
