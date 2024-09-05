import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  AzureProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/azure-provider-form/azure-provider-form.component';

describe('AzureProviderFormComponent', () => {
  let spectator: Spectator<AzureProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: AzureProviderFormComponent,
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
      account: 'azure',
      endpoint: 'blob.core.usgovcloudapi.net',
      key: 'key-1',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'Account Key': 'key-1',
      'Account Name': 'azure',
      Endpoint: 'blob.core.usgovcloudapi.net',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'Account Key': 'new-key',
      'Account Name': 'azure2',
      Endpoint: 'b-lob.usgovcloudapi.net',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      account: 'azure2',
      endpoint: 'b-lob.usgovcloudapi.net',
      key: 'new-key',
    });
  });
});
