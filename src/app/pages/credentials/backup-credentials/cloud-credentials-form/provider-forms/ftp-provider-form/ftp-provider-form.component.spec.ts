import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  FtpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';

describe('FtpProviderFormComponent', () => {
  let spectator: Spectator<FtpProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: FtpProviderFormComponent,
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
      host: 'truenas.com',
      user: 'jerry',
      pass: '1234567',
      port: 112,
    });

    const values = await form.getValues();
    expect(values).toEqual({
      Host: 'truenas.com',
      Port: '112',
      Username: 'jerry',
      Password: '1234567',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      Host: 'falsenas.com',
      Port: 9000,
      Username: 'thomas',
      Password: '',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      host: 'falsenas.com',
      port: 9000,
      user: 'thomas',
      pass: '',
    });
  });
});
