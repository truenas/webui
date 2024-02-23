import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { OauthButtonComponent } from 'app/modules/oauth-button/components/oauth-button/oauth-button.component';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  PcloudProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/pcloud-provider-form/pcloud-provider-form.component';

describe('PcloudProviderFormComponent', () => {
  let spectator: Spectator<PcloudProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: PcloudProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      OauthProviderComponent,
      OauthButtonComponent,
    ],
    providers: [
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        provider: {
          credentials_oauth: 'http://truenas.com/oauth',
        } as CloudSyncProvider,
      },
    });
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      client_id: 'clientid',
      client_secret: 'secret',
      token: 'token',
      hostname: 'truenas.com',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'OAuth Client ID': 'clientid',
      'OAuth Client Secret': 'secret',
      'Access Token': 'token',
      Hostname: 'truenas.com',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'OAuth Client ID': 'newclientid',
      'OAuth Client Secret': 'newsecret',
      'Access Token': 'newtoken',
      Hostname: 'new.truenas.com',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: 'newclientid',
      client_secret: 'newsecret',
      hostname: 'new.truenas.com',
      token: 'newtoken',
    });
  });
});
