import {
  ChangeDetectionStrategy, Component, input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { EncryptionKeyFormat, encryptionKeyFormatNames } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit, lifetimeUnitNames } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode, readonlyModeNames } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy, retentionPolicyNames } from 'app/enums/retention-policy.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextReplication } from 'app/helptext/data-protection/replication/replication';
import { Option } from 'app/interfaces/option.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ReplicationService } from 'app/services/replication.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-target-section',
  styleUrls: ['./target-section.component.scss'],
  templateUrl: './target-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    TranslateModule,
  ],
})
export class TargetSectionComponent implements OnInit, OnChanges {
  readonly replication = input<ReplicationTask>();
  readonly allowsCustomRetentionPolicy = input(false);
  readonly nodeProvider = input<TreeNodeProvider>();

  form = this.formBuilder.group({
    target_dataset: [null as string, Validators.required],
    readonly: [ReadOnlyMode.Require],
    encryption: [false],
    encryption_inherit: [false],
    encryption_key_format: [EncryptionKeyFormat.Hex, [Validators.required]],
    encryption_key_generate: [true],
    encryption_key_hex: [''],
    encryption_key_passphrase: [''],
    encryption_key_location_truenasdb: [true],
    encryption_key_location: [''],
    allow_from_scratch: [false],
    retention_policy: [RetentionPolicy.None],
    lifetime_value: [null as number, [Validators.required]],
    lifetime_unit: [LifetimeUnit.Week, [Validators.required]],
  });

  retentionPolicies$: Observable<Option[]>;

  readonly readonlyModes$ = of(mapToOptions(readonlyModeNames, this.translate));
  readonly encryptionKeyFormats$ = of(mapToOptions(encryptionKeyFormatNames, this.translate));
  readonly lifetimeUnits$ = of(mapToOptions(lifetimeUnitNames, this.translate));

  protected readonly RetentionPolicy = RetentionPolicy;

  protected readonly helptext = helptextReplication;

  private allRetentionPolicies$ = of(mapToOptions(retentionPolicyNames, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private replicationService: ReplicationService,
  ) {}

  get hasEncryption(): boolean {
    return this.form.value.encryption;
  }

  get hasEncryptionInherit(): boolean {
    return this.form.value.encryption_inherit;
  }

  get isHex(): boolean {
    return this.form.value.encryption_key_format === EncryptionKeyFormat.Hex;
  }

  ngOnChanges(): void {
    if (this.replication()) {
      this.setFormValues();
    }

    if (this.nodeProvider()) {
      this.form.controls.target_dataset.enable();
    } else {
      this.form.controls.target_dataset.disable();
    }

    this.setRetentionPolicyOptions();
  }

  ngOnInit(): void {
    this.setRetentionPolicyOptions();

    this.form.controls.lifetime_value.disable();
    this.form.controls.lifetime_unit.disable();

    this.form.controls.retention_policy.valueChanges.pipe(untilDestroyed(this)).subscribe((retentionPolicy) => {
      if (retentionPolicy === RetentionPolicy.Custom) {
        this.form.controls.lifetime_value.enable();
        this.form.controls.lifetime_unit.enable();
      } else {
        this.form.controls.lifetime_value.disable();
        this.form.controls.lifetime_unit.disable();
      }
    });

    this.form.controls.encryption_key_format.disable();

    combineLatest([
      this.form.controls.encryption.valueChanges,
      this.form.controls.encryption_inherit.valueChanges,
    ]).pipe(untilDestroyed(this)).subscribe(([encryption, encryptionInherit]) => {
      if (encryption && !encryptionInherit) {
        this.form.controls.encryption_key_format.enable();
      } else {
        this.form.controls.encryption_key_format.disable();
      }
    });
  }

  getPayload(): Partial<ReplicationCreate> {
    const values = this.form.value;
    const payload: Partial<ReplicationCreate> = {
      target_dataset: values.target_dataset,
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

  private setFormValues(): void {
    const usesTruenasKeyDb = this.replication().encryption_key_location === truenasDbKeyLocation;

    this.form.patchValue({
      ...this.replication(),
      encryption_key_location_truenasdb: usesTruenasKeyDb || !this.replication().encryption,
      encryption_key_location: usesTruenasKeyDb ? '' : (this.replication().encryption_key_location || ''),
    });

    if (this.isHex) {
      this.form.patchValue({
        encryption_key_passphrase: '',
        encryption_key_hex: this.replication().encryption_key || '',
        encryption_key_generate: false,
      });
    } else {
      this.form.patchValue({
        encryption_key_passphrase: this.replication().encryption_key || '',
        encryption_key_hex: '',
      });
    }
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
