import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  OpsGenieServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/ops-genie-service/ops-genie-service.component';

describe('OpsGenieServiceComponent', () => {
  let spectator: Spectator<OpsGenieServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: OpsGenieServiceComponent,
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
      api_key: '12345',
      api_url: 'https://docs.opsgenie.com/docs/api-overview/v2/alerts',
    });

    expect(await (await getInput('api_key')).getValue()).toBe('12345');
    expect(await (await getInput('api_url')).getValue()).toBe('https://docs.opsgenie.com/docs/api-overview/v2/alerts');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('api_key')).setValue('123456');
    await (await getInput('api_url')).setValue('https://docs.opsgenie.com/docs/api-overview/v3/alerts');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      api_key: '123456',
      api_url: 'https://docs.opsgenie.com/docs/api-overview/v3/alerts',
    });
  });
});
