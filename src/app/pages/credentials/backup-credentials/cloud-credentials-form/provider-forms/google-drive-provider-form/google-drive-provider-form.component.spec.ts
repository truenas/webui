import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  GoogleDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';

describe('GoogleDriveProviderFormComponent', () => {
  let spectator: Spectator<GoogleDriveProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: GoogleDriveProviderFormComponent,
    detectChanges: false,
    imports: [
      ReactiveFormsModule,
      OauthProviderComponent,
    ],
    providers: [
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.provider = {
      credentials_oauth: 'http://truenas.com/oauth',
    } as CloudSyncProvider;
    spectator.detectChanges();
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
