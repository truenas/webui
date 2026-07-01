import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import {
  TargetSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/target-section/target-section.component';
import { ReplicationService } from 'app/services/replication.service';

describe('TargetSectionComponent', () => {
  let spectator: Spectator<TargetSectionComponent>;
  let loader: HarnessLoader;
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

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasCheckbox = async (name: string): Promise<boolean> => {
    return Boolean(await loader.getHarnessOrNull(TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` })));
  };
  const hasSelect = async (name: string): Promise<boolean> => {
    return Boolean(await loader.getHarnessOrNull(TnSelectHarness.with({ selector: `[formControlName="${name}"]` })));
  };

  it('shows default values when creating a new replication task', async () => {
    expect(await (await getSelect('readonly')).getDisplayText()).toBe('REQUIRE');
    expect(await (await getCheckbox('encryption')).isChecked()).toBe(false);
    expect(await (await getCheckbox('allow_from_scratch')).isChecked()).toBe(false);
    expect(await (await getSelect('retention_policy')).getDisplayText()).toBe('None');
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

    expect(await (await getSelect('readonly')).getDisplayText()).toBe('SET');
    expect(await (await getCheckbox('encryption')).isChecked()).toBe(true);
    expect(await (await getCheckbox('encryption_inherit')).isChecked()).toBe(false);
    expect(await (await getSelect('encryption_key_format')).getDisplayText()).toBe('PASSPHRASE');
    expect(await (await getInput('encryption_key_passphrase')).getValue()).toBe('12345678');
    expect(await (await getCheckbox('encryption_key_location_truenasdb')).isChecked()).toBe(true);
    expect(await (await getCheckbox('allow_from_scratch')).isChecked()).toBe(true);
    expect(await (await getSelect('retention_policy')).getDisplayText()).toBe('None');
  });

  it('returns save payload when getPayload is called', async () => {
    spectator.setInput('nodeProvider', jest.fn());
    spectator.component.form.controls.target_dataset.setValue('tank/target');
    await (await getSelect('readonly')).selectOption('IGNORE');
    await (await getSelect('retention_policy')).selectOption('Same as Source');

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
      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Destination' }));
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
      await (await getCheckbox('encryption_inherit')).check();

      expect(await hasCheckbox('encryption')).toBe(true);
      expect(await hasCheckbox('encryption_inherit')).toBe(true);
      expect(await hasSelect('encryption_key_format')).toBe(false);
      expect(await hasCheckbox('encryption_key_generate')).toBe(false);
      expect(await hasCheckbox('encryption_key_location_truenasdb')).toBe(false);

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: true,
      });
    });

    it('shows encryption options when encryption is enabled', async () => {
      expect(await hasCheckbox('encryption')).toBe(true);
      expect(await hasCheckbox('encryption_inherit')).toBe(true);
      expect(await hasSelect('encryption_key_format')).toBe(true);
      expect(await hasCheckbox('encryption_key_generate')).toBe(true);
      expect(await hasCheckbox('encryption_key_location_truenasdb')).toBe(true);

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      });
    });

    it('shows Generate Encryption Key when HEX format is used', async () => {
      await (await getSelect('encryption_key_format')).selectOption('HEX');
      await (await getCheckbox('encryption_key_generate')).check();

      expect(await hasCheckbox('encryption_key_generate')).toBe(true);
      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
      });
      expect(spectator.inject(ReplicationService).generateEncryptionHexKey).toHaveBeenCalled();
    });

    it('shows field for entering key manually when HEX is used and Generate Key is unticked', async () => {
      await (await getCheckbox('encryption_key_generate')).uncheck();
      await (await getInput('encryption_key_hex')).setValue('123456');

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: truenasDbKeyLocation,
        encryption_key: '123456',
      });
    });

    it('shows encryption key location when `Store key in TrueNAS db` is unticked', async () => {
      await (await getCheckbox('encryption_key_location_truenasdb')).uncheck();
      await (await getInput('encryption_key_location')).setValue('/dbpath');

      expect(spectator.component.getPayload()).toMatchObject({
        encryption: true,
        encryption_inherit: false,
        encryption_key_format: EncryptionKeyFormat.Hex,
        encryption_key_location: '/dbpath',
      });
    });

    it('shows passphrase key when Passphrase encryption key is selected', async () => {
      await (await getSelect('encryption_key_format')).selectOption('PASSPHRASE');
      await (await getInput('encryption_key_passphrase')).setValue('mypass');

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
      await (await getSelect('retention_policy')).selectOption('Custom');
      spectator.setInput('allowsCustomRetentionPolicy', false);

      const retentionPolicySelect = await getSelect('retention_policy');
      expect(await retentionPolicySelect.getOptions()).toEqual(['Same as Source', 'None']);
      expect(await retentionPolicySelect.getDisplayText()).toBe('None');
    });

    it('shows snapshot lifetime fields when snapshot retention policy is custom', async () => {
      spectator.setInput('allowsCustomRetentionPolicy', true);
      await (await getSelect('retention_policy')).selectOption('Custom');
      await (await getInput('lifetime_value')).setValue('2');
      await (await getSelect('lifetime_unit')).selectOption('Week(s)');

      expect(spectator.component.getPayload()).toMatchObject({
        retention_policy: RetentionPolicy.Custom,
        lifetime_unit: LifetimeUnit.Week,
        lifetime_value: 2,
      });
    });
  });
});
