import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCardComponent, TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { SshKeypairCardComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.component';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

describe('SshKeypairCardComponent', () => {
  let spectator: Spectator<SshKeypairCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  async function openRowMenu(rowIndex = 0): Promise<TnMenuHarness> {
    const triggers = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await triggers[rowIndex].click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

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
      mockApi([
        mockCall('keychaincredential.query', credentials),
        mockCall('keychaincredential.delete'),
        mockCall('keychaincredential.used_by', []),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({ confirmed: true, secondaryCheckbox: false })),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(DownloadService),
      mockProvider(KeychainCredentialService, {
        getSshKeys: jest.fn(() => of(credentials)),
        refetchSshKeys: new Subject<void>(),
        refetchSshConnections: new Subject<void>(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('checks page title', () => {
    expect(spectator.query(TnCardComponent)!.title()).toBe('SSH Keypairs');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(SshKeypairFormComponent, {
      title: 'Add SSH Keypair',
    });
  });

  it('opens form when "Edit" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(SshKeypairFormComponent, {
      title: 'Edit SSH Keypair',
      inputs: { editKeypair: credentials[0] },
    });
  });

  it('deletes keypair without cascade when no associations exist', async () => {
    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
      if (method === 'keychaincredential.used_by') {
        return of([]);
      }
      return of(null);
    });
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of(true) as never);

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [10]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Are you sure you want to delete the <b>test1234</b>?',
      }),
    );
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [10, { cascade: false }]);
  });

  it('automatically cascades delete when keypair is used by other credentials', async () => {
    const usedByResponse = [
      {
        title: 'test-connection-1',
        unbind_method: 'keychaincredential.update',
      },
      {
        title: 'test-connection-2',
        unbind_method: 'keychaincredential.update',
      },
    ];

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
      if (method === 'keychaincredential.used_by') {
        return of(usedByResponse);
      }
      return of(null);
    });
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of(true) as never);
    const refetchSpy = jest.spyOn(spectator.inject(KeychainCredentialService).refetchSshConnections, 'next');

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [10]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'The SSH Keypair <b>test1234</b> is being used by the following:<br><br>• test-connection-1<br>• test-connection-2<br><br>Deleting it will also delete all associated SSH connections.',
      }),
    );
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [10, { cascade: true }]);
    expect(refetchSpy).toHaveBeenCalled();
  });

  it('checks when "Download" button is pressed', async () => {
    const storage = spectator.inject(DownloadService);
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Download' });

    expect(storage.downloadBlob).toHaveBeenCalledWith(new Blob(), 'test1234_private_key_rsa');
    expect(storage.downloadBlob).toHaveBeenCalledWith(new Blob(), 'test1234_public_key_rsa');
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['test1234', ''],
      ['test4321', ''],
    ]);
  });
});
