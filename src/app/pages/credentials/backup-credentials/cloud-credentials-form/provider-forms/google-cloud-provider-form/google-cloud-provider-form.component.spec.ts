import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  GoogleCloudProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';

describe('GoogleCloudProviderFormComponent', () => {
  let spectator: Spectator<GoogleCloudProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GoogleCloudProviderFormComponent,
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
      service_account_credentials: 'credentials1',
    });

    expect(await (await getInput('service_account_credentials')).getValue()).toBe('credentials1');
  });

  // Limited testing because of lack of support for file inputs in JSDOM.
  it('returns form attributes for submission when getSubmitAttributes() is called', () => {
    spectator.component.getFormSetter$().next({
      service_account_credentials: 'credentials1',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      service_account_credentials: 'credentials1',
    });
  });
});
