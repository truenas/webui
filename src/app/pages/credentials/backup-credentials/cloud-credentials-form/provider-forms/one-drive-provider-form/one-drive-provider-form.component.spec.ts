import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { OneDriveType } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  OneDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('OneDriveProviderFormComponent', () => {
  let spectator: Spectator<OneDriveProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: OneDriveProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      OauthProviderComponent,
    ],
    providers: [
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('cloudsync.onedrive_list_drives', [
          {
            drive_type: OneDriveType.Business,
            drive_id: 'business1',
          },
          {
            drive_type: OneDriveType.DocumentLibrary,
            drive_id: 'library1',
          },
        ]),
      ]),
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

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.onedrive_list_drives', [{
      client_id: 'newclient',
      client_secret: 'newsecret',
      token: 'newtoken',
    }]);

    const drivesSelect = await form.getControl('Drives List') as IxSelectHarness;
    expect(await drivesSelect.getOptionLabels()).toEqual([
      '--',
      'BUSINESS - business1',
      'DOCUMENT_LIBRARY - library1',
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
    await drivesSelect.setValue('BUSINESS - business1');

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
