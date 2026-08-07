import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
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
    });
  });

  describe('getPayload', () => {
    it('returns an empty payload when encryption is inherited', () => {
      expect(spectator.component.getPayload()).toEqual({});
    });

    it('only disables encryption when Encryption checkbox is unticked', async () => {
      await (await getCheckbox('inherit_encryption')).uncheck();
      await (await getCheckbox('encryption')).uncheck();

      expect(spectator.component.getPayload()).toEqual({ encryption: false });
    });

    it('sends encryption options without an algorithm when key is generated', async () => {
      await (await getCheckbox('inherit_encryption')).uncheck();

      expect(spectator.component.getPayload()).toEqual({
        encryption: true,
        encryption_options: { generate_key: true },
        inherit_encryption: false,
      });
    });

    it('sends the key entered by the user when Generate Key is unticked', async () => {
      const key = 'k'.repeat(64);
      await (await getCheckbox('inherit_encryption')).uncheck();
      await (await getCheckbox('generate_key')).uncheck();
      await (await getInput('key')).setValue(key);

      expect(spectator.component.getPayload()).toEqual({
        encryption: true,
        encryption_options: { key },
        inherit_encryption: false,
      });
    });

    it('sends passphrase options when Passphrase encryption is used', async () => {
      await (await getCheckbox('inherit_encryption')).uncheck();
      await (await getSelect('encryption_type')).selectOption('Passphrase');
      await (await getInput('passphrase')).setValue('12345678');
      await (await getInput('confirm_passphrase')).setValue('12345678');

      expect(spectator.component.getPayload()).toEqual({
        encryption: true,
        encryption_options: { passphrase: '12345678', pbkdf2iters: 1300000 },
        inherit_encryption: false,
      });
    });
  });
});
