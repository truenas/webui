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
import {
  WebdavProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';

describe('WebdavProviderFormComponent', () => {
  let spectator: Spectator<WebdavProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: WebdavProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.setValues({
      "url": "http://10.20.30.40/webdav",
      "vendor": "OWNCLOUD",
      "user": "adam",
      "pass": "apple"
    });

    const values = await form.getValues();
    expect(values).toEqual({
      "URL": "http://10.20.30.40/webdav",
      "WebDAV Service": "OWNCLOUD",
      "Username": "adam",
      "Password": "apple",
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      "URL": "http://10.10.10.1/webdav",
      "WebDAV Service": "OTHER",
      "Username": "eve",
      "Password": "apple",
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      "pass": "apple",
      "url": "http://10.10.10.1/webdav",
      "user": "eve",
      "vendor": "OTHER"
    });
  });
});
