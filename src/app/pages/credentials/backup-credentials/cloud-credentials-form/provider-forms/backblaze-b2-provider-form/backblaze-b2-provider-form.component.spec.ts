import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  BackblazeB2ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';

describe('BackblazeB2ProviderFormComponent', () => {
  let spectator: Spectator<BackblazeB2ProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: BackblazeB2ProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      key: '12345678',
      account: 'account-key',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'Application Key': '12345678',
      'Key ID': 'account-key',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'Application Key': '11111111',
      'Key ID': 'new-account-key',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      account: 'new-account-key',
      key: '11111111',
    });
  });
});
