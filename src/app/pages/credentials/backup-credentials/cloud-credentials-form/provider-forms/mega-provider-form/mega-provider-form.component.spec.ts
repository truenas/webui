import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  MegaProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';

describe('MegaProviderFormComponent', () => {
  let spectator: Spectator<MegaProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: MegaProviderFormComponent,
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
      user: 'samantha',
      pass: 'wordpass',
    });

    expect(await (await getInput('user')).getValue()).toBe('samantha');
    expect(await (await getInput('pass')).getValue()).toBe('wordpass');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('user')).setValue('samantha2');
    await (await getInput('pass')).setValue('12345678');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      user: 'samantha2',
      pass: '12345678',
    });
  });
});
