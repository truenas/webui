import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
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

  const allUnlocked: CoreBulkResponse[] = [{ error: null, result: true }, { error: null, result: true }];

  const createComponent = createComponentFactory({
    component: BulkUnlockSedDialog,
    providers: [
      mockAuth(),
      mockApi(),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
      { provide: MAT_DIALOG_DATA, useValue: { disks } },
    ],
  });

  /** Scripts what every `core.bulk` run answers from now on. */
  function scriptUnlock(results: CoreBulkResponse[]): void {
    spectator.inject(MockApiService).mockJob('core.bulk', fakeSuccessfulJob(results));
  }

  async function clickButton(text: string): Promise<void> {
    await (await loader.getHarness(MatButtonHarness.with({ text }))).click();
  }

  async function setPassword(label: string, value: string): Promise<void> {
    await (await loader.getHarness(IxInputHarness.with({ label }))).setValue(value);
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('lists the locked SEDs to unlock and skips the rest of the selection with the reason', () => {
    expect(spectator.query('h1')).toHaveText('Unlock SEDs');
    expect(spectator.queryAll('.disk .disk-name').map((name) => name.textContent)).toEqual(['sda', 'sdb']);
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
    await setPassword('Password', 'shared');
    await setPassword('Password for sdb (optional)', 'own');

    await clickButton('Unlock');

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', ['disk.unlock_sed', [
      [{ name: 'sda', password: 'shared' }],
      [{ name: 'sdb', password: 'own' }],
    ]]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('2 SED disks unlocked successfully');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
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

    expect(spectator.inject(MatDialogRef).close).not.toHaveBeenCalled();
    expect(spectator.query('.disk.unlocked .status')).toHaveText('Unlocked');
    expect(spectator.query('.status-failed')).toHaveText('[EACCES] Wrong password');

    scriptUnlock([{ error: null, result: true }]);
    await setPassword('Password for sdb (optional)', 'right');
    await clickButton('Retry');

    expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('core.bulk', ['disk.unlock_sed', [
      [{ name: 'sdb', password: 'right' }],
    ]]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('closes reporting whether any disk was unlocked, so the list knows to reload', async () => {
    await clickButton('Cancel');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenLastCalledWith(false);

    scriptUnlock([{ error: null, result: true }, { error: 'Failed', result: null }]);
    await clickButton('Unlock');
    await clickButton('Close');

    expect(spectator.inject(MatDialogRef).close).toHaveBeenLastCalledWith(true);
  });
});
