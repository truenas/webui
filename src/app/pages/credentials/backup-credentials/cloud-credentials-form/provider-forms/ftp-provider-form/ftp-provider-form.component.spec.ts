import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  FtpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';

describe('FtpProviderFormComponent', () => {
  let spectator: Spectator<FtpProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: FtpProviderFormComponent,
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
      host: 'truenas.com',
      user: 'jerry',
      pass: '1234567',
      port: 112,
    });

    expect(await (await getInput('host')).getValue()).toBe('truenas.com');
    expect(await (await getInput('port')).getValue()).toBe('112');
    expect(await (await getInput('user')).getValue()).toBe('jerry');
    expect(await (await getInput('pass')).getValue()).toBe('1234567');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('host')).setValue('falsenas.com');
    await (await getInput('port')).setValue('9000');
    await (await getInput('user')).setValue('thomas');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      host: 'falsenas.com',
      port: 9000,
      user: 'thomas',
      pass: '',
    });
  });
});
