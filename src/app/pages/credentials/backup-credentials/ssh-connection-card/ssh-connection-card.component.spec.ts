import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { SshConnectionCardComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.component';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

describe('SshConnectionCardComponent', () => {
  let spectator: Spectator<SshConnectionCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockApi([
        mockCall('keychaincredential.query', connections),
        mockCall('keychaincredential.delete'),
        mockCall('keychaincredential.used_by', []),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({ confirmed: true, secondaryCheckbox: false })),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(KeychainCredentialService, {
        getSshConnections: jest.fn(() => of(connections)),
        refetchSshKeys: new Subject<void>(),
        refetchSshConnections: new Subject<void>(),
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
    expect(title).toHaveText('SSH Connections');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SshConnectionFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 1);
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      SshConnectionFormComponent,
      {
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
      },
    );
  });

  it('shows cascade checkbox when connection has associated keypair', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        secondaryCheckbox: true, // Connection has private_key: 4
      }),
    );
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [5]);
  });

  it('hides cascade checkbox when connection has no associated keypair', async () => {
    const connectionWithoutKeypair: KeychainSshCredentials = {
      id: 7,
      name: 'test-conn-no-key',
      type: KeychainCredentialType.SshCredentials,
      attributes: {
        host: 'fake.host.name',
        port: 22,
        username: 'root',
        private_key: null,
        remote_host_key: 'ssh-rsa FAAAKE',
        connect_timeout: 10,
      },
    };

    spectator.component.credentials = [connectionWithoutKeypair];
    spectator.component.dataProvider.setRows([connectionWithoutKeypair]);
    spectator.detectChanges();

    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteButton.click();

    // When no keypair, uses simple confirm dialog (no secondaryCheckbox property)
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Are you sure you want to delete the <b>test-conn-no-key</b> SSH Connection?',
      }),
    );
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.not.objectContaining({
        secondaryCheckbox: expect.anything(),
      }),
    );
  });

  it('deletes connection and keypair when cascade checkbox is selected', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({ confirmed: true, secondaryCheckbox: true }));
    const refetchSpy = jest.spyOn(spectator.inject(KeychainCredentialService).refetchSshKeys, 'next');

    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteButton.click();

    // Should delete keypair with cascade, which also deletes the connection
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [4, { cascade: true }]);
    expect(refetchSpy).toHaveBeenCalled();
  });

  it('shows conditional warning message when deleting connection with shared keypair', async () => {
    const usedByResponse = [
      {
        title: 'test-conn-1',
        unbind_method: 'keychaincredential.update',
      },
      {
        title: 'test-conn-3',
        unbind_method: 'keychaincredential.update',
      },
    ];

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
      if (method === 'keychaincredential.used_by') {
        return of(usedByResponse);
      }
      return of(null);
    });

    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [4]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Are you sure you want to delete the <b>test-conn-1</b> SSH Connection?',
        secondaryCheckbox: true,
        secondaryCheckboxText: 'Delete associated SSH Keypair',
        secondaryCheckboxMessage: 'The associated SSH Keypair is also used by:<br><br>• test-conn-3<br><br>If you delete the keypair, all these SSH connections will also be deleted.',
      }),
    );
  });

  it('does not show secondary warning message when keypair is not shared with other connections', async () => {
    const usedByResponse = [
      {
        title: 'test-conn-1', // Only the current connection
        unbind_method: 'keychaincredential.update',
      },
    ];

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
      if (method === 'keychaincredential.used_by') {
        return of(usedByResponse);
      }
      return of(null);
    });

    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [4]);

    const confirmCall = (spectator.inject(DialogService).confirm as jest.Mock).mock.calls[0][0];
    expect(confirmCall).toMatchObject({
      message: 'Are you sure you want to delete the <b>test-conn-1</b> SSH Connection?',
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Delete associated SSH Keypair',
    });
    // Verify secondaryCheckboxMessage is not present (undefined properties are not included)
    expect(confirmCall.secondaryCheckboxMessage).toBeUndefined();
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
