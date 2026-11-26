import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { JobResult } from '@truenas/api-client';
import { TnButtonHarness, TnDialogHarness, TnInputHarness } from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { BulkUnlockSedDialog } from './bulk-unlock-sed-dialog.component';

describe('BulkUnlockSedDialog', () => {
  let spectator: Spectator<BulkUnlockSedDialog>;
  let loader: HarnessLoader;

  const disks = [
    {
      name: 'sda', model: 'Model A', serial: 'SERIAL-A', sed: true, sed_status: SedStatus.Locked,
    },
    {
      name: 'sdb', model: 'Model B', serial: 'SERIAL-B', sed: true, sed_status: SedStatus.Locked,
    },
    { name: 'sdc', sed: true, sed_status: SedStatus.Unlocked },
    { name: 'sdd', sed: false },
  ] as Disk[];

  const bulkResult = (results: CoreBulkResponse[]): JobResult<WebUiApiDirectory, 'core.bulk'> => {
    return results as JobResult<WebUiApiDirectory, 'core.bulk'>;
  };

  const createComponent = createComponentFactory({
    component: BulkUnlockSedDialog,
    providers: [
      mockAuth(),
      mockApi(),
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
      { provide: DIALOG_DATA, useValue: { disks } },
    ],
  });

  const allUnlocked = [{ error: null, result: true }, { error: null, result: true }];

  /**
   * Scripts the one `core.bulk` job a test may run. Every later run replays these same results, so
   * a retry that sends only the failed disk reads the first entry.
   */
  function scriptUnlock(results: CoreBulkResponse[]): void {
    spectator.inject(MockApiService).mockJob('core.bulk', { state: JobState.Success, result: bulkResult(results) });
  }

  async function clickButton(label: string): Promise<void> {
    await (await loader.getHarness(TnButtonHarness.with({ label }))).click();
    await spectator.fixture.whenStable();
  }

  function diskPassword(diskName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ ancestor: `[role="listitem"][aria-label="${diskName}"]` }));
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('lists the locked SEDs to unlock and skips the rest of the selection with the reason', async () => {
    expect(await (await loader.getHarness(TnDialogHarness)).getTitle()).toBe('Unlock SEDs');

    expect(spectator.queryAll('.disk strong').map((name) => name.textContent)).toEqual(['sda', 'sdb']);
    expect(spectator.queryAll('.disk .disk-meta').map((meta) => meta.textContent)).toEqual([
      'Model A (SERIAL-A)',
      'Model B (SERIAL-B)',
    ]);
    expect(spectator.queryAll('.skipped li').map((item) => item.textContent.trim())).toEqual([
      'sdc – Unlocked',
      'sdd – Unsupported',
    ]);
  });

  it('applies the shared password to every locked disk unless the disk has its own', async () => {
    scriptUnlock(allUnlocked);
    await (await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="password"]' })))
      .setValue('shared');
    await (await diskPassword('sdb')).setValue('own');

    await clickButton('Unlock');

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', ['disk.unlock_sed', [
      [{ name: 'sda', password: 'shared' }],
      [{ name: 'sdb', password: 'own' }],
    ]]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('2 SED disks unlocked successfully');
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('sends no password when none is entered, so middleware uses the saved or global SED password', async () => {
    scriptUnlock(allUnlocked);
    await clickButton('Unlock');

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', ['disk.unlock_sed', [
      [{ name: 'sda' }],
      [{ name: 'sdb' }],
    ]]);
  });

  it('stays open after a partial failure and retries only the disks that failed', async () => {
    scriptUnlock([{ error: null, result: true }, { error: '[EACCES] Wrong password', result: null }]);

    await clickButton('Unlock');

    expect(spectator.inject(DialogRef).close).not.toHaveBeenCalled();
    expect(spectator.query('.disk.unlocked .status')).toHaveText('Unlocked');
    expect(spectator.query('.status-failed')).toHaveText('[EACCES] Wrong password');

    await (await diskPassword('sdb')).setValue('right');
    await clickButton('Retry');

    expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('core.bulk', ['disk.unlock_sed', [
      [{ name: 'sdb', password: 'right' }],
    ]]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('offers no header close, so every way out reports whether to reload', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    await expect(dialog.close()).rejects.toThrow();
  });

  it('closes reporting whether any disk was unlocked, so the list knows to reload', async () => {
    await clickButton('Cancel');
    expect(spectator.inject(DialogRef).close).toHaveBeenLastCalledWith(false);

    scriptUnlock([{ error: null, result: true }, { error: 'Failed', result: null }]);
    await clickButton('Unlock');
    await clickButton('Close');

    expect(spectator.inject(DialogRef).close).toHaveBeenLastCalledWith(true);
  });
});
