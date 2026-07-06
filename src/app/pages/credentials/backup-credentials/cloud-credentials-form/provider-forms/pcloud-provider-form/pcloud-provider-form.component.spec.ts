import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  PcloudProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/pcloud-provider-form/pcloud-provider-form.component';

describe('PcloudProviderFormComponent', () => {
  let spectator: Spectator<PcloudProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: PcloudProviderFormComponent,
    detectChanges: false,
    imports: [
      ReactiveFormsModule,
      OauthProviderComponent,
    ],
    providers: [
      mockProvider(DialogService),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.provider = {
      credentials_oauth: 'http://truenas.com/oauth',
    } as CloudSyncProvider;
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      token: 'token',
      hostname: 'truenas.com',
    });

    expect(await (await getInput('token')).getValue()).toBe('token');
    expect(await (await getInput('hostname')).getValue()).toBe('truenas.com');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('token')).setValue('newtoken');
    await (await getInput('hostname')).setValue('new.truenas.com');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: '',
      client_secret: '',
      hostname: 'new.truenas.com',
      token: 'newtoken',
    });
  });
});
