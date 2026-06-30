import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import {
  SlackServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/slack-service/slack-service.component';

describe('SlackServiceComponent', () => {
  let spectator: Spectator<SlackServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SlackServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWindow({
        location: {
          protocol: 'https:',
        },
      }),
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
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    });

    expect(await (await getInput('url')).getValue())
      .toBe('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('url')).setValue('hooks.slack.com/services/T00000000/A11111111/XXXXXXXXXXXXXXXXXXXXXXXX');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      url: 'https://hooks.slack.com/services/T00000000/A11111111/XXXXXXXXXXXXXXXXXXXXXXXX',
    });
  });
});
