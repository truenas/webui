import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SshKeypairCardComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.component';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SshKeypairCardComponent', () => {
  let spectator: Spectator<SshKeypairCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const credentials = [
    {
      id: 10,
      name: 'test1234',
      type: 'SSH_KEY_PAIR',
      attributes: {
        private_key: 'test1234_private_key',
        public_key: 'test1234_public_key',
      },
    },
    {
      id: 11,
      name: 'test4321',
      type: 'SSH_KEY_PAIR',
      attributes: {
        private_key: 'test4321_private_key',
        public_key: 'test4321_public_key',
      },
    },
  ] as KeychainSshKeyPair[];

  const createComponent = createComponentFactory({
    component: SshKeypairCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('keychaincredential.query', credentials),
        mockCall('keychaincredential.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(DownloadService),
      mockProvider(KeychainCredentialService, {
        getSshKeys: jest.fn(() => of(credentials)),
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
    expect(title).toHaveText('SSH Keypairs');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SshKeypairFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 1);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SshKeypairFormComponent, {
      data: credentials[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.delete', [10]);
  });

  it('checks when "Download" button is pressed', async () => {
    const storage = spectator.inject(DownloadService);
    const downloadButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'save_alt' }), 1, 1);
    await downloadButton.click();

    expect(storage.downloadBlob).toHaveBeenCalledWith(new Blob(), 'test1234_private_key_rsa');
    expect(storage.downloadBlob).toHaveBeenCalledWith(new Blob(), 'test1234_public_key_rsa');
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', ''],
      ['test1234', ''],
      ['test4321', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
