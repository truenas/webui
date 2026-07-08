import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import {
  MattermostServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/mattermost-service/mattermost-service.component';

describe('MattermostServiceComponent', () => {
  let spectator: Spectator<MattermostServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: MattermostServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWindow({
        location: {
          protocol: 'http:',
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
      channel: 'general',
      icon_url: 'http://mattermost.com/icon.png',
      url: 'http://mattermost.com/webhook',
      username: 'john',
    });

    expect(await (await getInput('channel')).getValue()).toBe('general');
    expect(await (await getInput('icon_url')).getValue()).toBe('http://mattermost.com/icon.png');
    expect(await (await getInput('url')).getValue()).toBe('http://mattermost.com/webhook');
    expect(await (await getInput('username')).getValue()).toBe('john');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('channel')).setValue('random');
    await (await getInput('icon_url')).setValue('truenas.com/icon.png');
    await (await getInput('url')).setValue('truenas.com/webhook');
    await (await getInput('username')).setValue('eve');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      channel: 'random',
      icon_url: 'http://truenas.com/icon.png',
      url: 'http://truenas.com/webhook',
      username: 'eve',
    });
  });

  it('leaves an empty optional icon_url empty instead of normalizing it to a bare protocol', async () => {
    await (await getInput('url')).setValue('truenas.com/webhook');
    await (await getInput('username')).setValue('eve');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues.icon_url).toBe('');
  });
});
