import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';
import {
  SftpProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';

describe('SftpProviderFormComponent', () => {
  let spectator: Spectator<SftpProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SftpProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('keychaincredential.query', [
          { id: 1, name: 'Key 1' },
          { id: 2, name: 'Key 2' },
        ] as KeychainCredential[]),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.setValues({
      "host": "fbi.gov",
      "port": 22,
      "user": "mulder",
      "pass": "iwanttobelieve",
      "private_key": 1,
    });

    const values = await form.getValues();
    expect(values).toEqual({
      "Host": "fbi.gov",
      "Port": "22",
      "Username": "mulder",
      "Password": "iwanttobelieve",
      "Private Key": "Key 1",
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      "Host": "fbi.gov",
      "Username": "redacted",
      "Password": "redacted",
      "Private Key": "Key 2",
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      "host": "fbi.gov",
      "pass": "redacted",
      "private_key": 2,
      "user": "redacted"
    });
  });
});
