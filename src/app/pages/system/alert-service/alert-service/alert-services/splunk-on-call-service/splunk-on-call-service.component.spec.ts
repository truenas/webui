import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { SplunkOnCallServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/splunk-on-call-service/splunk-on-call-service.component';

describe('SplunkOnCallServiceComponent', () => {
  let spectator: Spectator<SplunkOnCallServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SplunkOnCallServiceComponent,
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
      api_key: 'KEY12345',
      routing_key: 'ROUTING_KEY1',
    });

    expect(await (await getInput('api_key')).getValue()).toBe('KEY12345');
    expect(await (await getInput('routing_key')).getValue()).toBe('ROUTING_KEY1');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('api_key')).setValue('KEY111111');
    await (await getInput('routing_key')).setValue('ROUTING_KEY2');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      api_key: 'KEY111111',
      routing_key: 'ROUTING_KEY2',
    });
  });
});
