import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { SshConnectionCardComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.component';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SshConnectionCardComponent', () => {
  let spectator: Spectator<SshConnectionCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const connections = [
    {
      id: 5,
      name: 'test-conn-1',
      type: 'SSH_CREDENTIALS',
      attributes: {
        host: 'fake.host.name',
        port: 22,
        username: 'root',
        private_key: 4,
        remote_host_key: 'ssh-rsa FAAAKE',
        connect_timeout: 10,
      },
    },
    {
      id: 6,
      name: 'test-conn-2',
      type: 'SSH_CREDENTIALS',
      attributes: {
        host: 'fake.host.name',
        port: 22,
        username: 'root',
        private_key: 4,
        remote_host_key: 'ssh-rsa FAAAKE',
        connect_timeout: 10,
      },
    },
  ] as KeychainSshCredentials[];

  const createComponent = createComponentFactory({
    component: SshConnectionCardComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebSocket([
        mockCall('keychaincredential.query', connections),
        mockCall('keychaincredential.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxChainedSlideInService, {
        pushComponent: jest.fn(() => of()),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('SSH Connections');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxChainedSlideInService).pushComponent).toHaveBeenCalledWith(SshConnectionFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 1);
    await editButton.click();

    expect(spectator.inject(IxChainedSlideInService).pushComponent).toHaveBeenCalledWith(
      SshConnectionFormComponent,
      false,
      {
        attributes: {
          connect_timeout: 10,
          host: 'fake.host.name',
          port: 22,
          private_key: 4,
          remote_host_key: 'ssh-rsa FAAAKE',
          username: 'root',
        },
        id: 5,
        name: 'test-conn-1',
        type: 'SSH_CREDENTIALS',
      },
    );
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 1);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.delete', [5]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', ''],
      ['test-conn-1', ''],
      ['test-conn-2', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
