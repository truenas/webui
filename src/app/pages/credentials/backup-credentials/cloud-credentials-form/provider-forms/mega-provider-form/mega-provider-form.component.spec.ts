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
  MegaProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';

describe('MegaProviderFormComponent', () => {
  let spectator: Spectator<MegaProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: MegaProviderFormComponent,
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
      user: "samantha",
      pass: "wordpass",
    });

    const values = await form.getValues();
    expect(values).toEqual({
      "Username": "samantha",
      "Password": "wordpass",
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      "Username": "samantha2",
      "Password": "12345678",
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      user: "samantha2",
      pass: "12345678",
    });
  });
});
