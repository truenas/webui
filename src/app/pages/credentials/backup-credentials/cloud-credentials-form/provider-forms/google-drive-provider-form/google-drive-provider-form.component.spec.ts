import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  GoogleDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';

describe('GoogleDriveProviderFormComponent', () => {
  let spectator: Spectator<GoogleDriveProviderFormComponent>;
  let details: DetailsTableHarness;
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
    details = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, DetailsTableHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      token: 'token1234',
      team_drive: 'teamdrive',
    });

    const values = await details.getValues();
    expect(values).toEqual({
      'Access Token': 'Token set',
      'Team Drive ID': 'teamdrive',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await details.setValues({
      'Access Token': 'newtoken',
      'Team Drive ID': 'newdrive',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: '',
      client_secret: '',
      team_drive: 'newdrive',
      token: 'newtoken',
    });
  });
});
