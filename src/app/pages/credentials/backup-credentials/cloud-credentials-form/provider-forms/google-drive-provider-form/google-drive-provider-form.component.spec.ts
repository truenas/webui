import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  GoogleDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';
import { DialogService } from 'app/services/dialog.service';

describe('GoogleDriveProviderFormComponent', () => {
  let spectator: Spectator<GoogleDriveProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: GoogleDriveProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      OauthProviderComponent,
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
        } as CloudsyncProvider,
      },
    });
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      client_id: 'client1234',
      client_secret: 'secret1234',
      token: 'token1234',
      team_drive: 'teamdrive',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'Access Token': 'token1234',
      'OAuth Client ID': 'client1234',
      'OAuth Client Secret': 'secret1234',
      'Team Drive ID': 'teamdrive',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'Access Token': 'newtoken',
      'OAuth Client ID': 'newclient',
      'OAuth Client Secret': 'newsecret',
      'Team Drive ID': 'newdrive',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: 'newclient',
      client_secret: 'newsecret',
      team_drive: 'newdrive',
      token: 'newtoken',
    });
  });
});
