import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnIconButtonHarness, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainSshKeyPair, SshKeyPair } from 'app/interfaces/keychain-credential.interface';
import {
  DialogService,
} from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';

describe('SshKeypairFormComponent', () => {
  let spectator: Spectator<SshKeypairFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const fakeSshKeyPair = {
    id: 23,
    name: 'existing key',
    attributes: {
      public_key: 'Existing public key',
      private_key: 'Existing private key',
    },
  } as KeychainSshKeyPair;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: SshKeypairFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('keychaincredential.generate_ssh_key_pair', {
          private_key: 'Generated private key',
          public_key: 'Generated public key',
        } as SshKeyPair),
        mockCall('keychaincredential.create'),
        mockCall('keychaincredential.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DownloadService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockAuth(),
    ],
  });

  describe('adding an ssh key pair', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'new',
        'Private Key': 'New private key',
        'Public Key': 'New public key',
      });

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('keychaincredential.create', [{
        name: 'new',
        type: KeychainCredentialType.SshKeyPair,
        attributes: {
          private_key: 'New private key',
          public_key: 'New public key',
        },
      }]);
    });

    describe('other', () => {
      it('fills textareas for public and private textareas when Generate Keypair is pressed', async () => {
        const generateButton = await loader.getHarness(TnButtonHarness.with({ label: 'Generate Keypair' }));
        await generateButton.click();

        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(api.call).toHaveBeenLastCalledWith('keychaincredential.generate_ssh_key_pair');
        expect(values).toMatchObject({
          'Private Key': 'Generated private key',
          'Public Key': 'Generated public key',
        });
      });

      it('allows public key to be downloaded when name and public key are not empty', async () => {
        const form = await loader.getHarness(IxFormHarness);
        await form.fillForm({
          Name: 'downloadname',
          'Public Key': 'Downloaded public key',
        });

        const actionsTrigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical' }));
        await actionsTrigger.click();
        const actionsMenu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
        await actionsMenu.clickItem({ label: 'Download Public Key' });

        expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(
          new Blob(['Downloaded public key'], { type: 'text/plain' }),
          'downloadname_public_key_rsa',
        );
      });

      it('allows private key to be downloaded when name and private key are not empty', async () => {
        const form = await loader.getHarness(IxFormHarness);
        await form.fillForm({
          Name: 'downloadname',
          'Private Key': 'Downloaded private key',
        });

        const actionsTrigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical' }));
        await actionsTrigger.click();
        const actionsMenu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
        await actionsMenu.clickItem({ label: 'Download Private Key' });

        expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(
          new Blob(['Downloaded private key'], { type: 'text/plain' }),
          'downloadname_private_key_rsa',
        );
      });
    });
  });

  describe('editing an ssh key pair', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => fakeSshKeyPair) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Name: 'existing key',
        'Private Key': 'Existing private key',
        'Public Key': 'Existing public key',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'new',
        'Private Key': 'New private key',
        'Public Key': 'New public key',
      });

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('keychaincredential.update', [
        23,
        {
          name: 'new',
          attributes: {
            private_key: 'New private key',
            public_key: 'New public key',
          },
        },
      ]);
    });
  });
});
