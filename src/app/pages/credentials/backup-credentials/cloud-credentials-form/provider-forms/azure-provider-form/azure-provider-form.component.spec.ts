import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  AzureProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/azure-provider-form/azure-provider-form.component';

describe('AzureProviderFormComponent', () => {
  let spectator: Spectator<AzureProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AzureProviderFormComponent,
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
      account: 'azure',
      endpoint: 'blob.core.usgovcloudapi.net',
      key: 'key-1',
    });

    expect(await (await getInput('account')).getValue()).toBe('azure');
    expect(await (await getInput('key')).getValue()).toBe('key-1');
    expect(await (await getInput('endpoint')).getValue()).toBe('blob.core.usgovcloudapi.net');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('account')).setValue('azure2');
    await (await getInput('key')).setValue('new-key');
    await (await getInput('endpoint')).setValue('b-lob.usgovcloudapi.net');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      account: 'azure2',
      endpoint: 'b-lob.usgovcloudapi.net',
      key: 'new-key',
    });
  });
});
