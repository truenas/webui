import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import {
  TargetSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/target-section/target-section.component';
import { ReplicationService } from 'app/services/replication.service';

describe('TargetSectionComponent', () => {
  let spectator: Spectator<TargetSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
  const createComponent = createComponentFactory({
    component: TargetSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(ReplicationService, {
        generateEncryptionHexKey: jest.fn().mockReturnValue('generated'),
      }),
      mockApi([
        mockCall('pool.dataset.query', []),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  it('shows default values when creating a new replication task', async () => {
    expect(await form.getValues()).toEqual({
      Destination: '',
      'Destination Dataset Read-only Policy': 'REQUIRE',
      Encryption: false,
      'Replication from scratch': false,
      'Snapshot Retention Policy': 'None',
    });
  });

  it('shows existing values when editing a replication task', async () => {
    spectator.setInput('replication', {
      target_dataset: 'tank/replication',
      readonly: ReadOnlyMode.Set,
      encryption: true,
      encryption_inherit: false,
      encryption_key_format: EncryptionKeyFormat.Passphrase,
      encryption_key: '12345678',
      encryption_key_location: truenasDbKeyLocation,
      allow_from_scratch: true,
    } as ReplicationTask);

    expect(await form.getValues()).toEqual({
      Destination: 'tank/replication',
      'Destination Dataset Read-only Policy': 'SET',
      Encryption: true,
      'Inherit Encryption': false,
      'Encryption Type': 'Passphrase',
      Passphrase: '12345678',
      'Store Encryption key in Sending TrueNAS database': true,
      'Replication from scratch': true,
      'Snapshot Retention Policy': 'None',
    });
  });

  it('returns save payload when getPayload is called', async () => {
    await form.fillForm({
      Destination: 'tank/target',
      'Destination Dataset Read-only Policy': 'IGNORE',
      'Snapshot Retention Policy': 'Same as Source',
    });

    expect(spectator.component.getPayload()).toEqual({
      target_dataset: 'tank/target',
      readonly: ReadOnlyMode.Ignore,
      encryption: false,
      allow_from_scratch: false,
      retention_policy: RetentionPolicy.Source,
      lifetime_unit: null,
      lifetime_value: null,
    });
  });

  describe('explorer', () => {
    it('uses tree node provider from input in explorer component', () => {
      const destinationProvided = jest.fn();
      spectator.setInput('nodeProvider', destinationProvided);

      const explorer = spectator.query(IxExplorerComponent)!;
      expect(explorer.nodeProvider()).toBe(destinationProvided);
    });

    it('disables explorer when nodeProvider is not provided', async () => {
      const explorer = await form.getControl('Destination');
      spectator.setInput('nodeProvider', null);
      expect(await explorer.isDisabled()).toBe(true);

      const sourceNodeProvider = jest.fn();
      spectator.setInput('nodeProvider', sourceNodeProvider);
      expect(await explorer.isDisabled()).toBe(false);
    });
  });

  describe('encryption', () => {
    beforeEach(() => {
      spectator.setInput('replication', {
        encryption: true,
        encryption_inherit: false,
        encryption_key_location: truenasDbKeyLocation,
      } as ReplicationTask);
    });

    it('hides encryption fields when Encryption inherit is selected', async () => {
      await form.fillForm({
        'Inherit Encryption': true,
      });

      const labels = await form.getLabels();
      expect(labels).toContain('Encryption');
      expect(labels).toContain('Inherit Encryption');
      expect(labels).not.toContain('Encryption Type');
      expect(labels).not.toContain('Generate Encryption Key');
      expect(labels).not.toContain('Store Encryption key in Sending TrueNAS database');

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: true,
      });
    });

    it('shows encryption options when encryption is enabled', async () => {
      const labels = await form.getLabels();
      expect(labels).toContain('Encryption');
      expect(labels).toContain('Inherit Encryption');
      expect(labels).toContain('Encryption Type');
      expect(labels).not.toContain('Generate Encryption Key');
      expect(labels).toContain('Store Encryption key in Sending TrueNAS database');

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      });
    });

    it('auto-generates encryption key when Key format is used', async () => {
      spectator.component.form.controls.encryption_key_generate.setValue(true);
      await form.fillForm({
        'Encryption Type': 'Key',
      });

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      });
      expect(spectator.inject(ReplicationService).generateEncryptionHexKey).toHaveBeenCalled();
    });

    it('shows encryption key location when `Store key in TrueNAS db` is unticked', async () => {
      await form.fillForm(
        {
          'Store Encryption key in Sending TrueNAS database': false,
          'Encryption Key Location in Target System': '/dbpath',
        },
      );

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: '/dbpath',
      });
    });

    it('shows passphrase key when Passphrase encryption key is selected', async () => {
      await form.fillForm(
        {
          'Encryption Type': 'Passphrase',
          Passphrase: 'mypass',
        },
      );

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key: 'mypass',
        encryption_key_format: EncryptionKeyFormat.Passphrase,
        encryption_key_location: truenasDbKeyLocation,
      });
    });
  });

  describe('source preserves properties', () => {
    it('disables encryption when sourcePreservesProperties is true', async () => {
      spectator.setInput('sourcePreservesProperties', true);

      const encryption = await form.getControl('Encryption');
      expect(await encryption.isDisabled()).toBe(true);
    });

    it('enables encryption when sourcePreservesProperties is false', async () => {
      spectator.setInput('sourcePreservesProperties', true);
      spectator.setInput('sourcePreservesProperties', false);

      const encryption = await form.getControl('Encryption');
      expect(await encryption.isDisabled()).toBe(false);
    });
  });

  describe('snapshot retention policy', () => {
    it('does not show custom retention policy when allowsCustomRetentionPolicy is false', async () => {
      spectator.setInput('allowsCustomRetentionPolicy', true);
      await form.fillForm({
        'Snapshot Retention Policy': 'Custom',
      });
      spectator.setInput('allowsCustomRetentionPolicy', false);

      const retentionPolicySelect = await form.getControl('Snapshot Retention Policy') as IxSelectHarness;
      expect(await retentionPolicySelect.getOptionLabels()).toEqual(['Same as Source', 'None']);
      expect(await retentionPolicySelect.getValue()).toBe('None');
    });

    it('shows snapshot lifetime fields when snapshot retention policy is custom', async () => {
      spectator.setInput('allowsCustomRetentionPolicy', true);
      await form.fillForm(
        {
          'Snapshot Retention Policy': 'Custom',
          'Snapshot Lifetime': '2',
          Unit: 'Week(s)',
        },
      );

      expect(spectator.component.getPayload()).toMatchObject({
        retention_policy: RetentionPolicy.Custom,
        lifetime_unit: LifetimeUnit.Week,
        lifetime_value: 2,
      });
    });
  });

  describe('target dataset validation for local target', () => {
    it('sets error on encryption when enabled but local destination is not encrypted', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        { encrypted: false, readonly: { value: OnOff.Off } },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);

      spectator.component.form.controls.encryption.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset is not encrypted. Disable encryption or select an encrypted destination.',
        },
      });
    }));

    it('sets error on encryption when disabled but local destination is encrypted', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        {
          id: 'tank/target', encrypted: true, encryption_root: 'tank', readonly: { value: OnOff.Off },
        },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset is encrypted. Enable encryption or select an unencrypted destination.',
        },
      });
    }));

    it('sets error on readonly when REQUIRE policy but destination is not readonly', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        { encrypted: false, readonly: { value: OnOff.Off } },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.readonly.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset does not have the readonly property enabled. The REQUIRE read-only policy will cause replication to fail.',
        },
      });
    }));

    it('does not set readonly error when destination has readonly enabled', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        { encrypted: false, readonly: { value: OnOff.On } },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.readonly.errors).toBeNull();
    }));

    it('does not set errors when target is not local', fakeAsync(() => {
      spectator.setInput('isLocalTarget', false);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);

      spectator.component.form.controls.encryption.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toBeNull();
    }));

    it('sets error on allow_from_scratch when destination has children and it is disabled', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', (params: unknown) => {
        const filter = (params as unknown[][])[0];
        if (Array.isArray(filter) && filter[0]?.[1] === '^') {
          return [{ id: 'tank/target/child' }] as Dataset[];
        }
        return [{ id: 'tank/target', encrypted: false, readonly: { value: OnOff.On } }] as Dataset[];
      });
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.allow_from_scratch.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset already has data. "Replication from scratch" must be enabled to overwrite existing data.',
        },
      });

      spectator.component.form.controls.allow_from_scratch.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.controls.allow_from_scratch.errors).toBeNull();
    }));

    it('does not set errors when destination dataset does not exist', fakeAsync(() => {
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/nonexistent');
      tick(300);

      spectator.component.form.controls.encryption.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toBeNull();
    }));

    it('does not set encryption error when encryption is disabled by sourcePreservesProperties', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        {
          id: 'tank/target', encrypted: true, encryption_root: 'tank', readonly: { value: OnOff.On },
        },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);
      spectator.setInput('sourcePreservesProperties', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toBeNull();
    }));

    it('sets encryption root error when destination is its own encryption root', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        {
          id: 'tank/target', encrypted: true, encryption_root: 'tank/target', readonly: { value: OnOff.On },
        },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset is its own encryption root. Replicating into an existing encryption root is not supported. Encrypt the parent dataset instead.',
        },
      });
    }));

    it('does not set encryption root error when encryption is enabled and destination is its own encryption root', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        {
          id: 'tank/target', encrypted: true, encryption_root: 'tank/target', readonly: { value: OnOff.On },
        },
      ] as Dataset[]);
      spectator.setInput('isLocalTarget', true);

      spectator.component.form.controls.encryption.setValue(true);
      spectator.component.form.controls.target_dataset.setValue('tank/target');
      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toBeNull();
    }));

    it('shows readonly warning for remote target with REQUIRE policy', () => {
      spectator.setInput('isLocalTarget', false);

      spectator.component.form.controls.readonly.setValue(ReadOnlyMode.Require);
      spectator.detectChanges();

      expect(spectator.component.form.controls.readonly.errors).toBeNull();
      expect(spectator.component.readonlyWarning).toContain('REQUIRE policy requires');
    });

    it('clears readonly warning when policy is not REQUIRE', () => {
      spectator.setInput('isLocalTarget', false);

      spectator.component.form.controls.readonly.setValue(ReadOnlyMode.Require);
      spectator.detectChanges();
      expect(spectator.component.readonlyWarning).toBeTruthy();

      spectator.component.form.controls.readonly.setValue(ReadOnlyMode.Ignore);
      spectator.detectChanges();
      expect(spectator.component.readonlyWarning).toBe('');
    });

    it('shows encryption error when editing a task with encryption on non-encrypted destination', fakeAsync(() => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', [
        { encrypted: false, readonly: { value: OnOff.Off } },
      ] as Dataset[]);

      spectator.setInput('isLocalTarget', true);
      spectator.setInput('replication', {
        target_dataset: 'tank/target',
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      } as ReplicationTask);

      tick(300);
      spectator.detectChanges();

      expect(spectator.component.form.controls.encryption.errors).toEqual({
        [ixManualValidateError]: {
          removable: false,
          message: 'Destination dataset is not encrypted. Disable encryption or select an encrypted destination.',
        },
      });
    }));
  });
});
