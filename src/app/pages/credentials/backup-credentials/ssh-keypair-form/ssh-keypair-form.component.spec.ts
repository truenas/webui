import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainSshKeyPair, SshKeyPair } from 'app/interfaces/keychain-credential.interface';
import {
  DialogService,
} from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import {
  SidePanelFooterMenuItem,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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

    it('sends a create payload to websocket and emits closed when submitted', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      await (await getInput('name')).setValue('new');
      await (await getInput('private_key')).setValue('New private key');
      await (await getInput('public_key')).setValue('New public key');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('keychaincredential.create', [{
        name: 'new',
        type: KeychainCredentialType.SshKeyPair,
        attributes: {
          private_key: 'New private key',
          public_key: 'New public key',
        },
      }]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });

    describe('other', () => {
      it('fills textareas for public and private textareas when Generate Keypair is pressed', async () => {
        const generateButton = await loader.getHarness(TnButtonHarness.with({ label: 'Generate Keypair' }));
        await generateButton.click();

        expect(api.call).toHaveBeenLastCalledWith('keychaincredential.generate_ssh_key_pair');
        expect(await (await getInput('private_key')).getValue()).toBe('Generated private key');
        expect(await (await getInput('public_key')).getValue()).toBe('Generated public key');
      });

      const getDownloadItem = (testId: string): SidePanelFooterMenuItem => spectator.component.footerActions[0]
        .menuItems!.find((item) => item.testId === testId)!;

      it('enables and runs the Download Public Key menu item when name and public key are set', async () => {
        const item = getDownloadItem('download-public-key');
        expect(item.disabled?.()).toBe(true);

        await (await getInput('name')).setValue('downloadname');
        await (await getInput('public_key')).setValue('Downloaded public key');

        expect(item.disabled?.()).toBe(false);
        item.onClick();

        expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(
          new Blob(['Downloaded public key'], { type: 'text/plain' }),
          'downloadname_public_key_rsa',
        );
      });

      it('enables and runs the Download Private Key menu item when name and private key are set', async () => {
        const item = getDownloadItem('download-private-key');
        expect(item.disabled?.()).toBe(true);

        await (await getInput('name')).setValue('downloadname');
        await (await getInput('private_key')).setValue('Downloaded private key');

        expect(item.disabled?.()).toBe(false);
        item.onClick();

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
        props: { editKeypair: fakeSshKeyPair },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current values when form is being edited', async () => {
      expect(await (await getInput('name')).getValue()).toBe('existing key');
      expect(await (await getInput('private_key')).getValue()).toBe('Existing private key');
      expect(await (await getInput('public_key')).getValue()).toBe('Existing public key');
    });

    it('sends an update payload to websocket and emits closed when submitted', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      await (await getInput('name')).setValue('new');
      await (await getInput('private_key')).setValue('New private key');
      await (await getInput('public_key')).setValue('New public key');

      spectator.component.submit();

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
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
