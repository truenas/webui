import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  HttpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';

describe('HttpProviderFormComponent', () => {
  let spectator: Spectator<HttpProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: HttpProviderFormComponent,
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
      url: 'http://truenas.com/provider',
    });

    expect(await (await getInput('url')).getValue()).toBe('http://truenas.com/provider');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('url')).setValue('truenas.com/sync');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      url: 'http://truenas.com/sync',
    });
  });
});
