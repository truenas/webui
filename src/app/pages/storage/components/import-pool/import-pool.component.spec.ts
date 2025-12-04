import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ImportPoolComponent } from './import-pool.component';

describe('ImportPoolComponent', () => {
  let spectator: Spectator<ImportPoolComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const mockPools: PoolFindResult[] = [{
    name: 'pool_name_1',
    guid: 'pool_guid_1',
    hostname: 'pool_hostname_1',
    status: PoolStatus.Online,
  }, {
    name: 'pool_name_2',
    guid: 'pool_guid_2',
    hostname: 'pool_hostname_2',
    status: PoolStatus.Online,
  }, {
    name: 'pool_name_3',
    guid: 'pool_guid_3',
    hostname: 'pool_hostname_3',
    status: PoolStatus.Online,
  }];

  const mockDiskDetailsNoLocked: DiskDetailsResponse = {
    used: [],
    unused: [
      {
        name: 'ada0', model: 'Samsung', serial: 'S123', size: 1000, sed_status: SedStatus.Unlocked,
      } as DetailsDisk,
    ],
  };

  const mockDiskDetailsWithLocked: DiskDetailsResponse = {
    used: [],
    unused: [
      {
        name: 'ada0', model: 'Samsung 870 EVO 2TB', serial: 'S5XYNS0T123456A', size: 2000000000000, sed_status: SedStatus.Locked,
      } as DetailsDisk,
      {
        name: 'ada1', model: 'Samsung 870 EVO 2TB', serial: 'S5XYNS0T123456B', size: 2000000000000, sed_status: SedStatus.Locked,
      } as DetailsDisk,
    ],
  };

  const createComponent = createComponentFactory({
    component: ImportPoolComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('pool.import_pool', fakeSuccessfulJob()),
        mockJob('pool.import_find', fakeSuccessfulJob(mockPools)),
        mockCall('disk.details', mockDiskDetailsNoLocked),
        mockCall('system.advanced.sed_global_password', 'existingpassword'),
        mockCall('pool.dataset.query', [{
          id: '/mnt/pewl',
          locked: true,
          encryption_root: '/mnt/pewl',
        } as Dataset]),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockAuth(),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads and shows the current list of pools to import when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const controls = await form.getControlHarnessesDict();
    const optionLabels = await (controls['Pool'] as IxSelectHarness).getOptionLabels();

    expect(api.job).toHaveBeenCalledWith('pool.import_find');
    expect(api.call).toHaveBeenCalledWith('disk.details');
    expect(optionLabels).toEqual([
      'pool_name_1 | pool_guid_1',
      'pool_name_2 | pool_guid_2',
      'pool_name_3 | pool_guid_3',
    ]);
  });

  it('imports a pool when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Pool: 'pool_name_1 | pool_guid_1',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(api.job).toHaveBeenCalledWith('pool.import_pool', [{ guid: 'pool_guid_1' }]);
  });

  it('checks if pool needs to be unlocked and prompts user to unlock it', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Pool: 'pool_name_1 | pool_guid_1',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(api.call).toHaveBeenCalledWith('pool.dataset.query', [[['name', '=', 'pool_name_1']]]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Unlock Pool',
    }));

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets', '/mnt/pewl', 'unlock']);
  });

  describe('with locked SED disks', () => {
    const createComponentWithLockedDisks = createComponentFactory({
      component: ImportPoolComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockApi([
          mockJob('pool.import_pool', fakeSuccessfulJob()),
          mockJob('pool.import_find', fakeSuccessfulJob(mockPools)),
          mockCall('disk.details', mockDiskDetailsWithLocked),
          mockCall('system.advanced.sed_global_password', 'existingpassword'),
          mockCall('disk.unlock_sed'),
          mockCall('pool.dataset.query', [{ id: '/mnt/pewl', locked: false } as Dataset]),
        ]),
        mockProvider(SlideInRef, slideInRef),
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(true)),
          jobDialog: jest.fn(() => ({
            afterClosed: () => of(undefined),
          })),
        }),
        mockAuth(),
        mockProvider(Router),
      ],
    });

    it('shows locked SED disks screen when locked disks are detected and does not call pool.import_find yet', () => {
      const lockedSpectator = createComponentWithLockedDisks();
      const lockedApi = lockedSpectator.inject(ApiService);

      expect(lockedSpectator.query('ix-locked-sed-disks')).toBeTruthy();
      expect(lockedSpectator.query('ix-fieldset')).toBeFalsy();
      expect(lockedApi.job).not.toHaveBeenCalledWith('pool.import_find');
    });

    it('calls pool.import_find and shows pool import form after skip is clicked', async () => {
      const lockedSpectator = createComponentWithLockedDisks();
      const lockedLoader = TestbedHarnessEnvironment.loader(lockedSpectator.fixture);
      const lockedApi = lockedSpectator.inject(ApiService);

      const skipButton = await lockedLoader.getHarness(MatButtonHarness.with({ text: 'Skip' }));
      await skipButton.click();

      expect(lockedApi.job).toHaveBeenCalledWith('pool.import_find');
      expect(lockedSpectator.query('ix-locked-sed-disks')).toBeFalsy();
      expect(lockedSpectator.query('ix-fieldset')).toBeTruthy();
    });

    it('shows unlock step when unlock is clicked', async () => {
      const lockedSpectator = createComponentWithLockedDisks();
      const lockedLoader = TestbedHarnessEnvironment.loader(lockedSpectator.fixture);

      const unlockButton = await lockedLoader.getHarness(MatButtonHarness.with({ text: 'Unlock' }));
      await unlockButton.click();

      expect(lockedSpectator.query('ix-locked-sed-disks')).toBeFalsy();
      expect(lockedSpectator.query('ix-unlock-sed-disks')).toBeTruthy();
    });
  });
});
