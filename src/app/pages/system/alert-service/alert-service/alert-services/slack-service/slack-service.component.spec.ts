import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  SlackServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/slack-service/slack-service.component';

describe('SlackServiceComponent', () => {
  let spectator: Spectator<SlackServiceComponent>;
  let form: IxFormHarness;
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

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('renders a form with alert service values', async () => {
    spectator.component.form.patchValue({
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'Webhook URL': 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      'Webhook URL': 'hooks.slack.com/services/T00000000/A11111111/XXXXXXXXXXXXXXXXXXXXXXXX',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      url: 'https://hooks.slack.com/services/T00000000/A11111111/XXXXXXXXXXXXXXXXXXXXXXXX',
    });
  });
});
