import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  MattermostServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/mattermost-service/mattermost-service.component';

describe('MattermostServiceComponent', () => {
  let spectator: Spectator<MattermostServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: MattermostServiceComponent,
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
      channel: 'general',
      icon_url: 'http://mattermost.com/icon.png',
      url: 'http://mattermost.com/webhook',
      username: 'john',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      Channel: 'general',
      'Icon URL': 'http://mattermost.com/icon.png',
      'Webhook URL': 'http://mattermost.com/webhook',
      Username: 'john',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      Channel: 'random',
      'Icon URL': 'truenas.com/icon.png',
      'Webhook URL': 'truenas.com/webhook',
      Username: 'eve',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      channel: 'random',
      icon_url: 'http://truenas.com/icon.png',
      url: 'http://truenas.com/webhook',
      username: 'eve',
    });
  });
});
