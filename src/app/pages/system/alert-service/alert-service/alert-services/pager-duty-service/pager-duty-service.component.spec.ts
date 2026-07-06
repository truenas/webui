import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  PagerDutyServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/pager-duty-service/pager-duty-service.component';

describe('PagerDutyServiceComponent', () => {
  let spectator: Spectator<PagerDutyServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: PagerDutyServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders a form with alert service values', async () => {
    spectator.component.form.patchValue({
      client_name: 'ixsystems',
      service_key: 'KEY123',
    });

    expect(await (await getInput('client_name')).getValue()).toBe('ixsystems');
    expect(await (await getInput('service_key')).getValue()).toBe('KEY123');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('client_name')).setValue('ixsystems2');
    await (await getInput('service_key')).setValue('KEY1234');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      client_name: 'ixsystems2',
      service_key: 'KEY1234',
    });
  });
});
