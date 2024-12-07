import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CloudCredentialsCardComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.component';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('CloudCredentialsCardComponent', () => {
  let spectator: Spectator<CloudCredentialsCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const credentials = [
    {
      id: 1,
      name: 'GDrive',
      provider: {
        type: CloudSyncProviderName.GoogleDrive,
        client_id: 'client_id',
        client_secret: 'client_secret',
        token: '{"access_token":"<token>","expiry":"2023-08-10T01:59:50.96113807-07:00"}',
        team_drive: '',
      },
    },
    {
      id: 2,
      name: 'BB2',
      provider: {
        type: CloudSyncProviderName.BackblazeB2,
        account: '<account>',
        key: '<key>',
      },
    },
  ] as CloudSyncCredential[];

  const providers = [{
    name: CloudSyncProviderName.GoogleDrive,
    title: 'Google Drive',
  }, {
    name: CloudSyncProviderName.BackblazeB2,
    title: 'Backblaze B2',
  }] as CloudSyncProvider[];

  const createComponent = createComponentFactory({
    component: CloudCredentialsCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockApi([
        mockCall('cloudsync.providers', providers),
        mockCall('cloudsync.credentials.query', credentials),
        mockCall('cloudsync.credentials.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(CloudCredentialService, {
        getProviders: jest.fn(() => of(providers)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Cloud Credentials');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(
      spectator.inject(ChainedSlideInService).open,
    ).toHaveBeenCalledWith(CloudCredentialsFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 2);
    await editButton.click();
    expect(
      spectator.inject(ChainedSlideInService).open,
    ).toHaveBeenCalledWith(CloudCredentialsFormComponent, false, { existingCredential: credentials[0] });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 2);
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.credentials.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Provider', ''],
      ['GDrive', 'Google Drive', ''],
      ['BB2', 'Backblaze B2', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
