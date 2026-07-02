import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { lastValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SftpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';

describe('SftpProviderFormComponent', () => {
  let spectator: Spectator<SftpProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SftpProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('keychaincredential.query', [
          { id: 1, name: 'Key 1' },
          { id: 2, name: 'Key 2' },
        ] as KeychainCredential[]),
        mockCall('keychaincredential.generate_ssh_key_pair', {
          public_key: 'public key',
          private_key: 'private key',
        }),
        mockCall('keychaincredential.create', {
          id: 7,
        } as KeychainCredential),
      ]),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows private keys together with Generate New in Private Key select', async () => {
    const privateKeySelect = await getSelect('private_key');
    await privateKeySelect.open();
    expect(await privateKeySelect.getOptions()).toEqual(['Generate New', 'Key 1', 'Key 2']);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      host: 'fbi.gov',
      port: 22,
      user: 'mulder',
      pass: 'iwanttobelieve',
      private_key: 1,
    });

    expect(await (await getInput('host')).getValue()).toBe('fbi.gov');
    expect(await (await getInput('port')).getValue()).toBe('22');
    expect(await (await getInput('user')).getValue()).toBe('mulder');
    expect(await (await getInput('pass')).getValue()).toBe('iwanttobelieve');
    expect(await (await getSelect('private_key')).getDisplayText()).toBe('Key 1');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('host')).setValue('fbi.gov');
    await (await getInput('user')).setValue('redacted');
    await (await getInput('pass')).setValue('redacted');
    await (await getSelect('private_key')).selectOption('Key 2');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      host: 'fbi.gov',
      pass: 'redacted',
      private_key: 2,
      user: 'redacted',
    });
  });

  it(`creates a new ssh keypair and updates private key field with new keypair id
   when Generate key is selected as Private Key and beforeSubmit is called`, async () => {
    await (await getInput('host')).setValue('sftp.truenas.com');
    await (await getSelect('private_key')).selectOption('Generate New');

    await lastValueFrom(spectator.component.beforeSubmit());

    const api = spectator.inject(ApiService);
    expect(api.call).toHaveBeenCalledWith('keychaincredential.generate_ssh_key_pair');
    expect(api.call).toHaveBeenCalledWith('keychaincredential.create', [{
      attributes: {
        private_key: 'private key',
        public_key: 'public key',
      },
      name: 'sftp.truenas.com Key',
      type: KeychainCredentialType.SshKeyPair,
    }]);

    const values = spectator.component.getSubmitAttributes();
    expect(values).toMatchObject({
      private_key: 7,
    });
  });
});
