import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { OneDriveType } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  OneDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';

describe('OneDriveProviderFormComponent', () => {
  let spectator: Spectator<OneDriveProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: OneDriveProviderFormComponent,
    detectChanges: false,
    imports: [
      ReactiveFormsModule,
      OauthProviderComponent,
    ],
    providers: [
      mockProvider(DialogService),
      mockApi([
        mockCall('cloudsync.onedrive_list_drives', [
          {
            drive_type: OneDriveType.Business,
            drive_id: 'business1',
            name: 'ODCMetadataArchive',
            description: 'ODC Archived Metadata',
          },
          {
            drive_type: OneDriveType.DocumentLibrary,
            drive_id: 'library1',
            name: 'OneDrive',
            description: '',
          },
        ]),
      ]),
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
      client_id: 'client',
      client_secret: 'secret',
      token: 'token',
      drive_type: OneDriveType.Personal,
      drive_id: 'driveid',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'OAuth Client ID': 'client',
      'OAuth Client Secret': 'secret',

      'Access Token': 'token',
      'Drives List': '',
      'Drive Account Type': 'PERSONAL',
      'Drive ID': 'driveid',
    });
  });

  it('loads a list of OneDrive drives and populates Drives List select when oAuth flow is completed', async () => {
    const oauthComponent = spectator.query(OauthProviderComponent);
    oauthComponent.form.setValue({
      client_id: 'newclient',
      client_secret: 'newsecret',
    });
    oauthComponent.authenticated.emit({
      token: 'newtoken',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.onedrive_list_drives', [{
      client_id: 'newclient',
      client_secret: 'newsecret',
      token: 'newtoken',
    }]);

    const drivesSelect = await form.getControl('Drives List') as IxSelectHarness;
    expect(await drivesSelect.getOptionLabels()).toEqual([
      '--',
      'ODCMetadataArchive - ODC Archived Metadata',
      'OneDrive',
    ]);
  });

  it('updates Drive Account Type and ID when a drive is selected from Drives List', async () => {
    const oauthComponent = spectator.query(OauthProviderComponent);
    oauthComponent.form.setValue({
      client_id: 'newclient',
      client_secret: 'newsecret',
    });
    oauthComponent.authenticated.emit({
      token: 'newtoken',
    });

    const drivesSelect = await form.getControl('Drives List') as IxSelectHarness;
    await drivesSelect.setValue('ODCMetadataArchive - ODC Archived Metadata');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toMatchObject({
      drive_id: 'business1',
      drive_type: OneDriveType.Business,
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      'OAuth Client ID': 'newclient',
      'OAuth Client Secret': 'newsecret',

      'Access Token': 'newtoken',
      'Drive Account Type': 'PERSONAL',
      'Drive ID': 'driveid',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: 'newclient',
      client_secret: 'newsecret',
      token: 'newtoken',
      drive_id: 'driveid',
      drive_type: OneDriveType.Personal,
    });
  });
});
