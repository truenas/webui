import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  WebdavProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';

describe('WebdavProviderFormComponent', () => {
  let spectator: Spectator<WebdavProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: WebdavProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      url: 'http://10.20.30.40/webdav',
      vendor: 'OWNCLOUD',
      user: 'adam',
      pass: 'apple',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      URL: 'http://10.20.30.40/webdav',
      'WebDAV Service': 'OWNCLOUD',
      Username: 'adam',
      Password: 'apple',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      URL: '10.10.10.1/webdav',
      'WebDAV Service': 'OTHER',
      Username: 'eve',
      Password: 'apple',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      pass: 'apple',
      url: 'http://10.10.10.1/webdav',
      user: 'eve',
      vendor: 'OTHER',
    });
  });
});
