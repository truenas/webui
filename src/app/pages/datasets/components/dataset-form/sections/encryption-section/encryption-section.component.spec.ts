import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFieldsetHarness } from 'app/modules/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IxTextareaHarness } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  EncryptionSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/encryption-section/encryption-section.component';
import { DialogService } from 'app/services/dialog.service';

describe('EncryptionSectionComponent', () => {
  let spectator: Spectator<EncryptionSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
  const keyEncryptedDataset = {
    encrypted: true,
    key_format: {
      value: DatasetEncryptionType.Default,
    },
    encryption_algorithm: {
      value: 'AES-128-GCM',
    },
  } as Dataset;
  const passphraseEncryptedDataset = {
    encrypted: true,
    key_format: {
      value: DatasetEncryptionType.Passphrase,
    },
  } as Dataset;

  const createComponent = createComponentFactory({
    component: EncryptionSectionComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-256-GCM': 'AES-256-GCM',
          'AES-128-GCM': 'AES-128-GCM',
        }),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        parent: {
          encrypted: false,
        } as Dataset,
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
      await form.fillForm({
        Encryption: false,
      });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: helptext.dataset_form_encryption.non_encrypted_warning_title,
        message: helptext.dataset_form_encryption.non_encrypted_warning_warning,
      });
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
      await form.fillForm({
        'Inherit (non-encrypted)': false,
      });
      await form.fillForm({
        'Generate Key': false,
      });

      const keyControl = await form.getControl('Key');
      expect(keyControl).toExist();
      expect(keyControl).toBeInstanceOf(IxTextareaHarness);
    });
  });

  describe('passphrase encryption', () => {
    it('shows Passphrase specific fields when Passphrase encryption is used', async () => {
      await form.fillForm({
        'Inherit (non-encrypted)': false,
      });
      await form.fillForm({
        'Encryption Type': 'Passphrase',
      });

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
