import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  OpsGenieServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/ops-genie-service/ops-genie-service.component';

describe('OpsGenieServiceComponent', () => {
  let spectator: Spectator<OpsGenieServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: OpsGenieServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('renders a form with alert service values', async () => {
    spectator.component.form.patchValue({
      api_key: '12345',
      api_url: 'https://docs.opsgenie.com/docs/api-overview/v2/alerts',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'API Key': '12345',
      'API URL': 'https://docs.opsgenie.com/docs/api-overview/v2/alerts',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      'API Key': '123456',
      'API URL': 'https://docs.opsgenie.com/docs/api-overview/v3/alerts',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      api_key: '123456',
      api_url: 'https://docs.opsgenie.com/docs/api-overview/v3/alerts',
    });
  });
});
