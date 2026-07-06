import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { OneDriveType } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  OneDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';

describe('OneDriveProviderFormComponent', () => {
  let spectator: Spectator<OneDriveProviderFormComponent>;
  let loader: HarnessLoader;
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
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
      drive_type: OneDriveType.Personal,
      drive_id: 'driveid',
    });

    expect(await (await getInput('token')).getValue()).toBe('token');
    expect(await (await getSelect('drives')).getDisplayText()).toBe('');
    expect(await (await getSelect('drive_type')).getDisplayText()).toBe('PERSONAL');
    expect(await (await getInput('drive_id')).getValue()).toBe('driveid');
  });

  it('loads a list of OneDrive drives and populates Drives List select when oAuth flow is completed', async () => {
    const oauthComponent = spectator.query(OauthProviderComponent);
    oauthComponent!.authenticated.emit({
      token: 'newtoken',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.onedrive_list_drives', [{
      client_id: '',
      client_secret: '',
      token: 'newtoken',
    }]);

    const drivesSelect = await getSelect('drives');
    await drivesSelect.open();
    expect(await drivesSelect.getOptions()).toEqual([
      'ODCMetadataArchive - ODC Archived Metadata',
      'OneDrive',
    ]);
  });

  it('updates Drive Account Type and ID when a drive is selected from Drives List', async () => {
    const oauthComponent = spectator.query(OauthProviderComponent);
    oauthComponent!.authenticated.emit({
      token: 'newtoken',
      client_id: 'newclient',
      client_secret: 'newsecret',
    });

    await (await getSelect('drives')).selectOption('ODCMetadataArchive - ODC Archived Metadata');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toMatchObject({
      drive_id: 'business1',
      drive_type: OneDriveType.Business,
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('token')).setValue('newtoken');
    await (await getSelect('drive_type')).selectOption('PERSONAL');
    await (await getInput('drive_id')).setValue('driveid');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: '',
      client_secret: '',
      token: 'newtoken',
      drive_id: 'driveid',
      drive_type: OneDriveType.Personal,
    });
  });
});
