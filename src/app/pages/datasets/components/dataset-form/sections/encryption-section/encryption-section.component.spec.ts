import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  EncryptionSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/encryption-section/encryption-section.component';

describe('EncryptionSectionComponent', () => {
  let spectator: Spectator<EncryptionSectionComponent>;
  let loader: HarnessLoader;
  const keyEncryptedDataset = {
    encrypted: true,
    key_format: {
      value: EncryptionKeyFormat.Hex,
    },
    encryption_algorithm: {
      value: 'AES-128-GCM',
    },
  } as Dataset;
  const passphraseEncryptedDataset = {
    encrypted: true,
    key_format: {
      value: EncryptionKeyFormat.Passphrase,
    },
  } as Dataset;

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: EncryptionSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-256-GCM': 'AES-256-GCM',
          'AES-128-GCM': 'AES-128-GCM',
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        parent: {
          encrypted: false,
        } as Dataset,
        advancedMode: true,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('inheriting encryption', () => {
    it('shows label explaining encryption status of the parent', async () => {
      const inherit = await getCheckbox('inherit_encryption');
      expect(await inherit.getLabelText()).toBe('Inherit (non-encrypted)');

      spectator.setInput('parent', keyEncryptedDataset);
      expect(await inherit.getLabelText()).toBe('Inherit (encrypted)');
    });

    it('does not show other encryption fields when Inherit is true', async () => {
      const checkboxes = await loader.getAllHarnesses(TnCheckboxHarness);
      expect(checkboxes).toHaveLength(1);
      expect(await checkboxes[0].getLabelText()).toBe('Inherit (non-encrypted)');

      const selects = await loader.getAllHarnesses(TnSelectHarness);
      expect(selects).toHaveLength(0);
    });
  });

  describe('not inheriting encryption', () => {
    it('defaults to parent\'s algorithm', async () => {
      spectator.setInput('parent', keyEncryptedDataset);

      await (await getCheckbox('inherit_encryption')).uncheck();

      const algorithm = await getSelect('algorithm');
      expect(await algorithm.getDisplayText()).toBe('AES-128-GCM');
    });

    it('shows Encryption Type select when parent is key encrypted', async () => {
      spectator.setInput('parent', keyEncryptedDataset);

      await (await getCheckbox('inherit_encryption')).uncheck();

      const encryptionType = await getSelect('encryption_type');
      expect(await encryptionType.getDisplayText()).toBe('Key');
    });

    it('does not show Encryption Type select when parent is passphrase encrypted', async () => {
      spectator.setInput('parent', passphraseEncryptedDataset);

      await (await getCheckbox('inherit_encryption')).uncheck();

      const encryptionTypeSelects = await loader.getAllHarnesses(
        TnSelectHarness.with({ selector: '[formControlName="encryption_type"]' }),
      );
      expect(encryptionTypeSelects).toHaveLength(0);
    });

    it('shows a warning when parent is encrypted, but user is unchecking Encryption checkbox', async () => {
      spectator.setInput('parent', keyEncryptedDataset);

      await (await getCheckbox('inherit_encryption')).uncheck();

      const encryption = await getCheckbox('encryption');
      expect(await encryption.isDisabled()).toBe(true);
    });
  });

  describe('key encryption', () => {
    it('shows Key specific fields when Key encryption is used', async () => {
      await (await getCheckbox('inherit_encryption')).uncheck();

      expect(await (await getCheckbox('encryption')).isChecked()).toBe(true);
      expect(await (await getCheckbox('generate_key')).isChecked()).toBe(true);
      expect(await (await getSelect('encryption_type')).getDisplayText()).toBe('Key');
      expect(await (await getSelect('algorithm')).getDisplayText()).toBe('AES-256-GCM');
    });

    it('shows Key field when Generate Key checkbox is unticked', async () => {
      await (await getCheckbox('inherit_encryption')).uncheck();
      await (await getCheckbox('generate_key')).uncheck();

      const keyInput = await getInput('key');
      expect(keyInput).toBeTruthy();
      expect(await keyInput.getValue()).toBe('');
    });
  });

  describe('passphrase encryption', () => {
    it('shows Passphrase specific fields when Passphrase encryption is used', async () => {
      await (await getCheckbox('inherit_encryption')).uncheck();
      await (await getSelect('encryption_type')).selectOption('Passphrase');

      expect(await (await getInput('passphrase')).getValue()).toBe('');
      expect(await (await getInput('confirm_passphrase')).getValue()).toBe('');
      expect(await (await getInput('pbkdf2iters')).getValue()).toBe('1300000');
      expect(await (await getSelect('algorithm')).getDisplayText()).toBe('AES-256-GCM');
    });
  });
});
