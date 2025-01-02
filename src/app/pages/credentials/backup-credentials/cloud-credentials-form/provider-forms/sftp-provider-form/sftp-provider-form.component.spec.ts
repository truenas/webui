import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SftpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';

describe('SftpProviderFormComponent', () => {
  let spectator: Spectator<SftpProviderFormComponent>;
  let form: IxFormHarness;
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

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('loads and shows private keys together with Generate New in Private Key select', async () => {
    const privateKeySelect = await form.getControl('Private Key') as IxSelectHarness;
    expect(await privateKeySelect.getOptionLabels()).toEqual(['--', 'Generate New', 'Key 1', 'Key 2']);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      host: 'fbi.gov',
      port: 22,
      user: 'mulder',
      pass: 'iwanttobelieve',
      private_key: 1,
    });

    const values = await form.getValues();
    expect(values).toEqual({
      Host: 'fbi.gov',
      Port: '22',
      Username: 'mulder',
      Password: 'iwanttobelieve',
      'Private Key': 'Key 1',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      Host: 'fbi.gov',
      Username: 'redacted',
      Password: 'redacted',
      'Private Key': 'Key 2',
    });

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
    await form.fillForm({
      Host: 'sftp.truenas.com',
      'Private Key': 'Generate New',
    });

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
