import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SplunkOnCallServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/splunk-on-call-service/splunk-on-call-service.component';

describe('SplunkOnCallServiceComponent', () => {
  let spectator: Spectator<SplunkOnCallServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SplunkOnCallServiceComponent,
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
      api_key: 'KEY12345',
      routing_key: 'ROUTING_KEY1',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'API Key': 'KEY12345',
      'Routing Key': 'ROUTING_KEY1',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      'API Key': 'KEY111111',
      'Routing Key': 'ROUTING_KEY2',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      api_key: 'KEY111111',
      routing_key: 'ROUTING_KEY2',
    });
  });
});
