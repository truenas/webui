import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  BackblazeB2ProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';
import {
  FtpProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';
import {
  HttpProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';

describe('HttpProviderFormComponent', () => {
  let spectator: Spectator<HttpProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: HttpProviderFormComponent,
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
      url: "http://truenas.com/provider",
    });

    const values = await form.getValues();
    expect(values).toEqual({
      "URL": 'http://truenas.com/provider'
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      "URL": "http://truenas.com/sync"
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      url: "http://truenas.com/sync",
    });
  });
});
