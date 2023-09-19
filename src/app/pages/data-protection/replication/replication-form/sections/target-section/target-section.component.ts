import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { EncryptionKeyFormat, encryptionKeyFormatNames } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit, lifetimeUnitNames } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode, readonlyModeNames } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy, retentionPolicyNames } from 'app/enums/retention-policy.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/data-protection/replication/replication';
import { Option } from 'app/interfaces/option.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { ReplicationService } from 'app/services/replication.service';

@Component({
  selector: 'ix-replication-target-section',
  styleUrls: ['./target-section.component.scss'],
  templateUrl: './target-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetSectionComponent implements OnInit, OnChanges {
  @Input() replication: ReplicationTask;
  @Input() allowsCustomRetentionPolicy = false;
  @Input() nodeProvider: TreeNodeProvider;

  form = this.formBuilder.group({
    target_dataset: [null as string, Validators.required],
    readonly: [ReadOnlyMode.Require],
    encryption: [false],
    encryption_inherit: [false],
    encryption_key_format: [EncryptionKeyFormat.Hex],
    encryption_key_generate: [true],
    encryption_key_hex: [''],
    encryption_key_passphrase: [''],
    encryption_key_location_truenasdb: [true],
    encryption_key_location: [''],
    allow_from_scratch: [false],
    retention_policy: [RetentionPolicy.None],
    lifetime_value: [null as number],
    lifetime_unit: [LifetimeUnit.Week],
  });

  retentionPolicies$: Observable<Option[]>;

  readonly readonlyModes$ = of(mapToOptions(readonlyModeNames, this.translate));
  readonly encryptionKeyFormats$ = of(mapToOptions(encryptionKeyFormatNames, this.translate));
  readonly lifetimeUnits$ = of(mapToOptions(lifetimeUnitNames, this.translate));

  protected readonly RetentionPolicy = RetentionPolicy;

  protected readonly helptext = helptext;

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
    if (this.replication) {
      this.setFormValues();
    }

    if (this.nodeProvider) {
      this.form.controls.target_dataset.enable();
    } else {
      this.form.controls.target_dataset.disable();
    }

    this.setRetentionPolicyOptions();
  }

  ngOnInit(): void {
    this.setRetentionPolicyOptions();
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
    const usesTruenasKeyDb = this.replication.encryption_key_location === truenasDbKeyLocation;

    this.form.patchValue({
      ...this.replication,
      encryption_key_location_truenasdb: usesTruenasKeyDb || !this.replication.encryption,
      encryption_key_location: usesTruenasKeyDb ? '' : (this.replication.encryption_key_location || ''),
    });

    if (this.isHex) {
      this.form.patchValue({
        encryption_key_passphrase: '',
        encryption_key_hex: this.replication.encryption_key || '',
        encryption_key_generate: false,
      });
    } else {
      this.form.patchValue({
        encryption_key_passphrase: this.replication.encryption_key || '',
        encryption_key_hex: '',
      });
    }
  }

  private setRetentionPolicyOptions(): void {
    if (this.allowsCustomRetentionPolicy) {
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
