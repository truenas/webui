import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
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
      'Encryption Key Format': 'PASSPHRASE',
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

      const explorer = spectator.query(IxExplorerComponent);
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
      expect(labels).not.toContain('Encryption Key Format');
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
      expect(labels).toContain('Encryption Key Format');
      expect(labels).toContain('Generate Encryption Key');
      expect(labels).toContain('Store Encryption key in Sending TrueNAS database');

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      });
    });

    it('shows Generate Encryption Key when HEX format is used', async () => {
      await form.fillForm({
        'Encryption Key Format': 'HEX',
        'Generate Encryption Key': true,
      });

      expect(await form.getLabels()).toContain('Generate Encryption Key');
      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      });
      expect(spectator.inject(ReplicationService).generateEncryptionHexKey).toHaveBeenCalled();
    });

    it('shows field for entering key manually when HEX is used and Generate Key is unticked', async () => {
      await form.fillForm(
        {
          'Generate Encryption Key': false,
          'Encryption Key': '123456',
        },
      );

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
        encryption_key: '123456',
      });
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
          'Encryption Key Format': 'PASSPHRASE',
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
});
