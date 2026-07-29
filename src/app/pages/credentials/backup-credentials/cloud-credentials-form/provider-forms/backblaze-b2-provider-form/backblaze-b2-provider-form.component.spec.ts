import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  BackblazeB2ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';

describe('BackblazeB2ProviderFormComponent', () => {
  let spectator: Spectator<BackblazeB2ProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: BackblazeB2ProviderFormComponent,
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

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      key: '12345678',
      account: 'account-key',
    });

    expect(await (await getInput('key')).getValue()).toBe('12345678');
    expect(await (await getInput('account')).getValue()).toBe('account-key');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('key')).setValue('11111111');
    await (await getInput('account')).setValue('new-account-key');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      account: 'new-account-key',
      key: '11111111',
    });
  });
});
