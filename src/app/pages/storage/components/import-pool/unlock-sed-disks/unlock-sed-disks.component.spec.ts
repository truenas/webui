import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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

  function getGlobalPassword(harnessLoader: HarnessLoader = loader): Promise<TnInputHarness> {
    return harnessLoader.getHarness(TnInputHarness.with({ selector: '[formControlName="globalPassword"]' }));
  }

  function getUnlockButton(harnessLoader: HarnessLoader = loader): Promise<TnButtonHarness> {
    return harnessLoader.getHarness(TnButtonHarness.with({ label: 'Unlock Disks' }));
  }

  beforeEach(() => {
    spectator = createComponent({
      props: { lockedDisks },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows global password input', async () => {
    expect(await getGlobalPassword()).toBeTruthy();
  });

  it('prefills global password from input', async () => {
    spectator.setInput('globalSedPassword', 'existingpassword');

    expect(await (await getGlobalPassword()).getValue()).toBe('existingpassword');
  });

  it('unlock button is disabled when password is empty', async () => {
    expect(await (await getUnlockButton()).isDisabled()).toBe(true);
  });

  it('unlock button is enabled when password is entered', async () => {
    await (await getGlobalPassword()).setValue('testpassword');

    expect(await (await getUnlockButton()).isDisabled()).toBe(false);
  });

  it('calls system.advanced.update and core.bulk when unlock is clicked with default settings', async () => {
    const api = spectator.inject(ApiService);
    jest.spyOn(spectator.component.unlocked, 'emit');

    await (await getGlobalPassword()).setValue('testpassword');
    await (await getUnlockButton()).click();

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

    await (await getGlobalPassword()).setValue('testpassword');

    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.uncheck();

    await (await getUnlockButton()).click();

    expect(api.call).not.toHaveBeenCalledWith('system.advanced.update', expect.anything());
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });

  it('emits skip event when skip button is clicked', async () => {
    jest.spyOn(spectator.component.skip, 'emit');

    const skipButton = await loader.getHarness(TnButtonHarness.with({ label: 'Skip' }));
    await skipButton.click();

    expect(spectator.component.skip.emit).toHaveBeenCalled();
  });

  it('allows adding disk exceptions with tn-select and tn-input', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add Disk Exception' }));
    await addButton.click();

    const diskSelects = await loader.getAllHarnesses(
      TnSelectHarness.with({ selector: '[formControlName="diskName"]' }),
    );
    expect(diskSelects).toHaveLength(1);

    const passwordInputs = await loader.getAllHarnesses(
      TnInputHarness.with({ selector: '[formControlName="password"]' }),
    );
    expect(passwordInputs).toHaveLength(1);
  });

  describe('partial success', () => {
    const partialSuccessResponse: CoreBulkResponse[] = [
      { error: null, result: null },
      { error: 'Invalid password', result: null },
    ];

    const createPartialComponent = createComponentFactory({
      component: UnlockSedDisksComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockApi([
          mockJob('core.bulk', fakeSuccessfulJob(partialSuccessResponse)),
          mockCall('system.advanced.update'),
        ]),
        mockProvider(SnackbarService),
        mockProvider(ErrorHandlerService),
        mockProvider(DialogService, {
          jobDialog: jest.fn(() => ({
            afterClosed: () => of(fakeSuccessfulJob(partialSuccessResponse)),
          })),
        }),
        mockAuth(),
      ],
    });

    it('shows partial success message when some disks fail to unlock', async () => {
      const spectatorPartial = createPartialComponent({
        props: { lockedDisks },
      });
      const partialLoader = TestbedHarnessEnvironment.loader(spectatorPartial.fixture);

      jest.spyOn(spectatorPartial.component.unlocked, 'emit');

      await (await getGlobalPassword(partialLoader)).setValue('testpassword');
      await (await getUnlockButton(partialLoader)).click();

      expect(spectatorPartial.inject(SnackbarService).success).toHaveBeenCalledWith(
        expect.stringContaining('1 of 2'),
      );
      expect(spectatorPartial.component.unlocked.emit).toHaveBeenCalled();
    });
  });

  describe('all fail', () => {
    const allFailResponse: CoreBulkResponse[] = [
      { error: 'Invalid password', result: null },
      { error: 'Device busy', result: null },
    ];

    const createFailComponent = createComponentFactory({
      component: UnlockSedDisksComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockApi([
          mockJob('core.bulk', fakeSuccessfulJob(allFailResponse)),
          mockCall('system.advanced.update'),
        ]),
        mockProvider(SnackbarService),
        mockProvider(ErrorHandlerService),
        mockProvider(DialogService, {
          jobDialog: jest.fn(() => ({
            afterClosed: () => of(fakeSuccessfulJob(allFailResponse)),
          })),
          error: jest.fn(),
        }),
        mockAuth(),
      ],
    });

    it('shows error dialog when all disks fail to unlock', async () => {
      const spectatorFail = createFailComponent({
        props: { lockedDisks },
      });
      const failLoader = TestbedHarnessEnvironment.loader(spectatorFail.fixture);

      jest.spyOn(spectatorFail.component.unlocked, 'emit');

      await (await getGlobalPassword(failLoader)).setValue('testpassword');
      await (await getUnlockButton(failLoader)).click();

      expect(spectatorFail.inject(DialogService).error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to Unlock Disks',
          message: expect.stringContaining('ada0'),
        }),
      );
      expect(spectatorFail.component.unlocked.emit).not.toHaveBeenCalled();
    });
  });
});
