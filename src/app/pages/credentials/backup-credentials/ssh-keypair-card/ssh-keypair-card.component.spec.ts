import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SshKeypairCardComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.component';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

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
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('SSH Keypairs');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SshKeypairFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SshKeypairFormComponent, {
      data: credentials[0],
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

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [10]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.not.objectContaining({
        secondaryCheckbox: expect.anything(),
      }),
    );
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [10, { cascade: false }]);
  });

  it('shows cascade checkbox when keypair is used by an SSH connection', async () => {
    const usedByResponse = [{
      title: 'SSH Connection (test-connection)',
      unbind_method: 'keychaincredential.update',
    }];

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
      if (method === 'keychaincredential.used_by') {
        return of(usedByResponse);
      }
      return of(null);
    });
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({ confirmed: true, secondaryCheckbox: true }));
    const refetchSpy = jest.spyOn(spectator.inject(KeychainCredentialService).refetchSshConnections, 'next');

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.used_by', [10]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        secondaryCheckbox: true,
      }),
    );
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [10, { cascade: true }]);
    expect(refetchSpy).toHaveBeenCalled();
  });

  it('deletes keypair without cascade when user does not check the box even if in use', async () => {
    const usedByResponse = [{
      title: 'SSH Connection (test-connection)',
      unbind_method: 'keychaincredential.update',
    }];

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
      if (method === 'keychaincredential.used_by') {
        return of(usedByResponse);
      }
      return of(null);
    });
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({ confirmed: true, secondaryCheckbox: false }));

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    // Should still attempt delete with cascade: false (backend will show error)
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('keychaincredential.delete', [10, { cascade: false }]);
  });

  it('checks when "Download" button is pressed', async () => {
    const storage = spectator.inject(DownloadService);
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Download' });

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
