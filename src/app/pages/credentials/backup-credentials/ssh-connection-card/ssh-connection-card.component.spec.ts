import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { SshConnectionCardComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.component';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SshConnectionCardComponent', () => {
  let spectator: Spectator<SshConnectionCardComponent>;
  let loader: HarnessLoader;

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
      mockWebsocket([
        mockCall('keychaincredential.query', connections),
        mockCall('keychaincredential.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('SSH Connections');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SshConnectionFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SshConnectionFormComponent, {
      data: {
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
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('keychaincredential.delete', [5]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', ''],
      ['test-conn-1', ''],
      ['test-conn-2', ''],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
