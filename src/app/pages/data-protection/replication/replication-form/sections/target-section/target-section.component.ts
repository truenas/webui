import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { EncryptionKeyFormat, encryptionKeyFormatNames } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit, lifetimeUnitNames } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode, readonlyModeNames } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy, retentionPolicyNames } from 'app/enums/retention-policy.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/data-protection/replication/replication';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { ReplicationService } from 'app/services';

@Component({
  selector: 'ix-replication-target-section',
  templateUrl: './target-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetSectionComponent implements OnChanges {
  @Input() replication: ReplicationTask;
  @Input() nodeProvider: TreeNodeProvider;

  form = this.formBuilder.group({
    target_dataset: [null as string, Validators.required],
    readonly: [ReadOnlyMode.Require],
    encryption: [false],
    encryption_key_format: [EncryptionKeyFormat.Hex],
    encryption_key_generate: [true],
    encryption_key: [''],
    encryption_key_location_truenasdb: [true],
    encryption_key_location: [''],
    allow_from_scratch: [false],
    retention_policy: [RetentionPolicy.None],
    lifetime_value: [null as number],
    lifetime_unit: [LifetimeUnit.Week],
  });

  readonly readonlyModes$ = of(mapToOptions(readonlyModeNames, this.translate));
  readonly encryptionKeyFormats$ = of(mapToOptions(encryptionKeyFormatNames, this.translate));
  readonly retentionPolicies$ = of(mapToOptions(retentionPolicyNames, this.translate));
  readonly lifetimeUnits$ = of(mapToOptions(lifetimeUnitNames, this.translate));

  protected readonly RetentionPolicy = RetentionPolicy;
  protected readonly EncryptionKeyFormat = EncryptionKeyFormat;

  protected readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private replicationService: ReplicationService,
  ) {}

  get hasEncryption(): boolean {
    return this.form.value.encryption;
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
      payload.encryption_key_format = values.encryption_key_format;
      payload.encryption_key_location = values.encryption_key_location_truenasdb
        ? truenasDbKeyLocation
        : values.encryption_key_location;

      const needsToGenerateHexKey = values.encryption_key_format === EncryptionKeyFormat.Hex
        && values.encryption_key_generate;
      payload.encryption_key = needsToGenerateHexKey
        ? this.replicationService.generateEncryptionHexKey(64)
        : values.encryption_key;
    }

    if (values.retention_policy === RetentionPolicy.Custom) {
      payload.lifetime_value = values.lifetime_value;
      payload.lifetime_unit = values.lifetime_unit;
    }

    return payload;
  }

  private setFormValues(): void {
    const usesTruenasKeyDb = this.replication.encryption_key_location === truenasDbKeyLocation;

    this.form.patchValue({
      ...this.replication,
      encryption_key_location_truenasdb: usesTruenasKeyDb,
      encryption_key_location: usesTruenasKeyDb ? '' : (this.replication.encryption_key_location || ''),
      encryption_key: this.replication.encryption_key || '',
    });
  }
}
