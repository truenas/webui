import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  MegaProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';

describe('MegaProviderFormComponent', () => {
  let spectator: Spectator<MegaProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: MegaProviderFormComponent,
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
      user: 'samantha',
      pass: 'wordpass',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      Username: 'samantha',
      Password: 'wordpass',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      Username: 'samantha2',
      Password: '12345678',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      user: 'samantha2',
      pass: '12345678',
    });
  });
});
