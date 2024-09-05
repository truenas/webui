import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  PagerDutyServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/pager-duty-service/pager-duty-service.component';

describe('PagerDutyServiceComponent', () => {
  let spectator: Spectator<PagerDutyServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: PagerDutyServiceComponent,
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
      client_name: 'ixsystems',
      service_key: 'KEY123',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'Client Name': 'ixsystems',
      'Service Key': 'KEY123',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      'Client Name': 'ixsystems2',
      'Service Key': 'KEY1234',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      client_name: 'ixsystems2',
      service_key: 'KEY1234',
    });
  });
});
