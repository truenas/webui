import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  StorjProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';

describe('StorjProviderFormComponent', () => {
  let spectator: Spectator<StorjProviderFormComponent>;
  let form: IxFormHarness;
  let details: DetailsTableHarness;
  const createComponent = createComponentFactory({
    component: StorjProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    // Mock scrollIntoView since it's not available in test environment
    Element.prototype.scrollIntoView = jest.fn();

    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
    details = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, DetailsTableHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      access_key_id: 'my-key-id',
      secret_access_key: 'my-secret-key',
    });

    const formValues = await form.getValues();
    expect(formValues).toEqual({
      'Access Key ID': 'my-key-id',
      'Secret Access Key': 'my-secret-key',
    });

    const detailValues = await details.getValues();
    expect(detailValues).toEqual({
      Endpoint: 'https://gateway.storjshare.io',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'Access Key ID': 'updated-key-id',
      'Secret Access Key': 'updated-secret-key',
    });

    await details.setValues({
      Endpoint: 'https://us1.storj.io',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      access_key_id: 'updated-key-id',
      secret_access_key: 'updated-secret-key',
      endpoint: 'https://us1.storj.io',
    });
  });
});
