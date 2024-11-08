import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IxTextareaHarness } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.harness';
import {
  EncryptionSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/encryption-section/encryption-section.component';

describe('EncryptionSectionComponent', () => {
  let spectator: Spectator<EncryptionSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
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

  const createComponent = createComponentFactory({
    component: EncryptionSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-256-GCM': 'AES-256-GCM',
          'AES-128-GCM': 'AES-128-GCM',
        }),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        warn: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        parent: {
          encrypted: false,
        } as Dataset,
        advancedMode: true,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  describe('inheriting encryption', () => {
    it('shows label explaining encryption status of the parent', async () => {
      expect(await form.getLabels()).toEqual(['Inherit (non-encrypted)']);

      spectator.setInput('parent', keyEncryptedDataset);
      expect(await form.getLabels()).toEqual(['Inherit (encrypted)']);
    });

    it('does not show other encryption fields when Inherit is true', async () => {
      const controls = await form.getControlHarnesses();
      expect(controls).toHaveLength(1);
      expect(controls[0]).toBeInstanceOf(IxCheckboxHarness);
      expect(await controls[0].getLabelText()).toBe('Inherit (non-encrypted)');
    });
  });

  describe('not inheriting encryption', () => {
    it('defaults to parent\'s algorithm', async () => {
      spectator.setInput('parent', keyEncryptedDataset);

      await form.fillForm({
        'Inherit (encrypted)': false,
      });

      expect(await form.getValues()).toEqual(expect.objectContaining({
        Algorithm: 'AES-128-GCM',
      }));
    });

    it('shows Encryption Type select when parent is key encrypted', async () => {
      spectator.setInput('parent', keyEncryptedDataset);

      await form.fillForm({
        'Inherit (encrypted)': false,
      });

      expect(await form.getValues()).toEqual(expect.objectContaining({
        'Encryption Type': 'Key',
      }));
    });

    it('does not show Encryption Type select when parent is passphrase encrypted', async () => {
      spectator.setInput('parent', passphraseEncryptedDataset);

      await form.fillForm({
        'Inherit (encrypted)': false,
      });

      expect(await form.getLabels()).not.toContain('Encryption Type');
    });

    it('shows a warning when parent is encrypted, but user is unchecking Encryption checkbox', async () => {
      spectator.setInput('parent', keyEncryptedDataset);

      await form.fillForm({
        'Inherit (encrypted)': false,
      });

      const encryptionFc = await form.getControl('Encryption');
      const isEncryptionDisabled = await encryptionFc.isDisabled();
      expect(isEncryptionDisabled).toBe(true);
    });
  });

  describe('key encryption', () => {
    it('shows Key specific fields when Key encryption is used', async () => {
      await form.fillForm({
        'Inherit (non-encrypted)': false,
      });

      expect(await form.getValues()).toEqual({
        'Inherit (non-encrypted)': false,
        Encryption: true,
        'Generate Key': true,
        'Encryption Type': 'Key',
        Algorithm: 'AES-256-GCM',
      });
    });

    it('shows Key field when Generate Key checkbox is unticked', async () => {
      await form.fillForm(
        {
          'Inherit (non-encrypted)': false,
          'Generate Key': false,
        },
      );

      const keyControl = await form.getControl('Key');
      expect(keyControl).toExist();
      expect(keyControl).toBeInstanceOf(IxTextareaHarness);
    });
  });

  describe('passphrase encryption', () => {
    it('shows Passphrase specific fields when Passphrase encryption is used', async () => {
      await form.fillForm(
        {
          'Inherit (non-encrypted)': false,
          'Encryption Type': 'Passphrase',
        },
      );

      expect(await form.getValues()).toEqual({
        'Inherit (non-encrypted)': false,
        Encryption: true,
        'Encryption Type': 'Passphrase',
        'Confirm Passphrase': '',
        Passphrase: '',
        pbkdf2iters: '350000',
        Algorithm: 'AES-256-GCM',
      });
    });
  });
});
