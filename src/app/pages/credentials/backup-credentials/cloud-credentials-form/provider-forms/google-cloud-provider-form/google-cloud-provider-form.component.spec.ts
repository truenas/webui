import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  GoogleCloudProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';

describe('GoogleCloudProviderFormComponent', () => {
  let spectator: Spectator<GoogleCloudProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: GoogleCloudProviderFormComponent,
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
      service_account_credentials: 'credentials1',
    });

    const values = await form.getValues();
    expect(values).toMatchObject({
      'Preview JSON Service Account Key': 'credentials1',
    });
  });

  // Limited testing because of lack of support for file inputs in JSDOM.
  it('returns form attributes for submission when getSubmitAttributes() is called', () => {
    spectator.component.getFormSetter$().next({
      service_account_credentials: 'credentials1',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      service_account_credentials: 'credentials1',
    });
  });
});
