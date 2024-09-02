import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  HttpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';

describe('HttpProviderFormComponent', () => {
  let spectator: Spectator<HttpProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: HttpProviderFormComponent,
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
      url: 'http://truenas.com/provider',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      URL: 'http://truenas.com/provider',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      URL: 'truenas.com/sync',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      url: 'http://truenas.com/sync',
    });
  });
});
