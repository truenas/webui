import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import {
  WebdavProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';

describe('WebdavProviderFormComponent', () => {
  let spectator: Spectator<WebdavProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: WebdavProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      url: 'http://10.20.30.40/webdav',
      vendor: 'OWNCLOUD',
      user: 'adam',
      pass: 'apple',
    });

    expect(await (await getInput('url')).getValue()).toBe('http://10.20.30.40/webdav');
    expect(await (await getSelect('vendor')).getDisplayText()).toBe('OWNCLOUD');
    expect(await (await getInput('user')).getValue()).toBe('adam');
    expect(await (await getInput('pass')).getValue()).toBe('apple');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('url')).setValue('10.10.10.1/webdav');
    await (await getSelect('vendor')).selectOption('OTHER');
    await (await getInput('user')).setValue('eve');
    await (await getInput('pass')).setValue('apple');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      pass: 'apple',
      url: 'http://10.10.10.1/webdav',
      user: 'eve',
      vendor: 'OTHER',
    });
  });
});
