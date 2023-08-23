import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CloudCredentialsCardComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.component';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudCredentialsCardComponent', () => {
  let spectator: Spectator<CloudCredentialsCardComponent>;
  let loader: HarnessLoader;

  const credentials = [
    {
      id: 1,
      name: 'GDrive',
      provider: 'GOOGLE_DRIVE',
      attributes: {
        client_id: 'client_id',
        client_secret: 'client_secret',
        token: '{"access_token":"<token>","expiry":"2023-08-10T01:59:50.96113807-07:00"}',
        team_drive: '',
      },
    },
    {
      id: 2,
      name: 'BB2',
      provider: 'B2',
      attributes: {
        account: '<account>',
        key: '<key>',
      },
    },
  ] as CloudsyncCredential[];

  const providers = [{
    name: 'GOOGLE_DRIVE',
    title: 'Google Drive',
  }, {
    name: 'B2',
    title: 'Backblaze B2',
  }] as CloudsyncProvider[];

  const createComponent = createComponentFactory({
    component: CloudCredentialsCardComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.providers', providers),
        mockCall('cloudsync.credentials.query', credentials),
        mockCall('cloudsync.credentials.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(CloudCredentialService, {
        getProviders: jest.fn(() => of(providers)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Cloud Credentials');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudCredentialsFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudCredentialsFormComponent, {
      data: credentials[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.credentials.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Provider', ''],
      ['GDrive', 'Google Drive', ''],
      ['BB2', 'Backblaze B2', ''],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
