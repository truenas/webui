import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { LockedSedDisk } from 'app/pages/storage/components/import-pool/utils/sed-disk.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UnlockSedDisksComponent } from './unlock-sed-disks.component';

describe('UnlockSedDisksComponent', () => {
  let spectator: Spectator<UnlockSedDisksComponent>;
  let loader: HarnessLoader;

  const lockedDisks: LockedSedDisk[] = [
    {
      name: 'ada0', model: 'Samsung 870 EVO 2TB', serial: 'S5XYNS0T123456A', size: 2000000000000,
    },
    {
      name: 'ada1', model: 'WD Red Pro 4TB', serial: 'WD-WCC7K3KRH2K9', size: 4000000000000,
    },
  ];

  const mockBulkResponse: CoreBulkResponse[] = [
    { error: null, result: null },
    { error: null, result: null },
  ];

  const createComponent = createComponentFactory({
    component: UnlockSedDisksComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockJob('core.bulk', fakeSuccessfulJob(mockBulkResponse)),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(fakeSuccessfulJob(mockBulkResponse)),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { lockedDisks },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows global password input', async () => {
    const passwordInput = await loader.getHarness(IxInputHarness.with({ label: 'Global SED Password' }));
    expect(passwordInput).toBeTruthy();
  });

  it('prefills global password from input', async () => {
    spectator.setInput('globalSedPassword', 'existingpassword');

    const passwordInput = await loader.getHarness(IxInputHarness.with({ label: 'Global SED Password' }));
    expect(await passwordInput.getValue()).toBe('existingpassword');
  });

  it('unlock button is disabled when password is empty', async () => {
    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock Disks' }));
    expect(await unlockButton.isDisabled()).toBe(true);
  });

  it('unlock button is enabled when password is entered', async () => {
    const passwordInput = await loader.getHarness(IxInputHarness.with({ label: 'Global SED Password' }));
    await passwordInput.setValue('testpassword');

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock Disks' }));
    expect(await unlockButton.isDisabled()).toBe(false);
  });

  it('calls system.advanced.update and core.bulk when unlock is clicked with default settings', async () => {
    const api = spectator.inject(ApiService);
    jest.spyOn(spectator.component.unlocked, 'emit');

    const passwordInput = await loader.getHarness(IxInputHarness.with({ label: 'Global SED Password' }));
    await passwordInput.setValue('testpassword');

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock Disks' }));
    await unlockButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ sed_passwd: 'testpassword' }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(api.job).toHaveBeenCalledWith('core.bulk', [
      'disk.unlock_sed',
      [
        [{ name: 'ada0', password: 'testpassword' }],
        [{ name: 'ada1', password: 'testpassword' }],
      ],
    ]);
    expect(spectator.component.unlocked.emit).toHaveBeenCalled();
  });

  it('does not call system.advanced.update when updateGlobalSettings is unchecked', async () => {
    const api = spectator.inject(ApiService);

    const passwordInput = await loader.getHarness(IxInputHarness.with({ label: 'Global SED Password' }));
    await passwordInput.setValue('testpassword');

    const checkbox = await loader.getHarness(MatCheckboxHarness);
    await checkbox.uncheck();

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock Disks' }));
    await unlockButton.click();

    expect(api.call).not.toHaveBeenCalledWith('system.advanced.update', expect.anything());
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });

  it('emits skip event when skip button is clicked', async () => {
    jest.spyOn(spectator.component.skip, 'emit');

    const skipButton = await loader.getHarness(MatButtonHarness.with({ text: 'Skip' }));
    await skipButton.click();

    expect(spectator.component.skip.emit).toHaveBeenCalled();
  });

  it('allows adding disk exceptions with ix-select and ix-input', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Disk Exception' }));
    await addButton.click();

    const exceptionItems = spectator.queryAll('.exception-item');
    expect(exceptionItems).toHaveLength(1);

    const diskSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk' }));
    expect(diskSelect).toBeTruthy();

    const passwordInput = await loader.getHarness(IxInputHarness.with({ label: 'Password' }));
    expect(passwordInput).toBeTruthy();
  });
});
