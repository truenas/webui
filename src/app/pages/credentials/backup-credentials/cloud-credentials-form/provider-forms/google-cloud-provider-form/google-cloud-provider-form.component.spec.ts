import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { IxFileInputHarness } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  BackblazeB2ProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';
import {
  FtpProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';
import {
  GoogleCloudProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';

describe('GoogleCloudProviderFormComponent', () => {
  let spectator: Spectator<GoogleCloudProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: GoogleCloudProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', () => {
    spectator.component.setValues({
      service_account_credentials: 'credentials1',
    });

    const values = await form.getValues();
    expect(values).toMatchObject({
      "Preview JSON Service Account Key": "credentials1"
    });
  });

  // Limited testing because of lack of support for file inputs in JSDOM.
  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    spectator.component.setValues({
      service_account_credentials: 'credentials1',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      "service_account_credentials": "credentials1"
    });
  });
});
