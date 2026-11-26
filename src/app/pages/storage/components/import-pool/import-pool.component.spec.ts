import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
import { NEVER, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import {
  mockApi, mockCall, mockJob, mockQuery,
} from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ZfsResourceEntry } from 'app/services/dataset/zfs-resource.utils';
import { ImportPoolComponent } from './import-pool.component';

type DiskDetailsCallResponse = CallResponse<WebUiApiDirectory, 'disk.details'>;

describe('ImportPoolComponent', () => {
  let spectator: Spectator<ImportPoolComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

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
      ...ixFormTestingProviders(),
      mockApi([
        mockJob('pool.import_pool', { state: JobState.Success }),
        mockJob('pool.import_find', { state: JobState.Success, result: mockPools }),
        mockQuery('pool.query', []),
        mockCall('disk.details', mockDiskDetailsNoLocked as unknown as DiskDetailsCallResponse),
        mockCall('system.advanced.sed_global_password', 'existingpassword'),
        mockCall('zfs.resource.list', [{
          name: 'pewl',
          pool: 'pewl',
          type: 'FILESYSTEM',
          properties: {
            encryption: { raw: 'aes-256-gcm', value: 'aes-256-gcm', source: null },
            encryptionroot: { raw: 'pewl', value: 'pewl', source: null },
            keystatus: { raw: 'unavailable', value: 'unavailable', source: null },
          },
        }] as ZfsResourceEntry[]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn((job$) => ({
          afterClosed: () => job$,
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

  function getPoolSelect(): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="guid"]' }));
  }

  it('loads and shows the current list of pools to import when form is opened', async () => {
    const optionLabels = await (await getPoolSelect()).getOptions();

    expect(api.job).toHaveBeenCalledWith('pool.import_find');
    expect(api.call).toHaveBeenCalledWith('disk.details');
    expect(optionLabels).toEqual([
      'pool_name_1 | pool_guid_1',
      'pool_name_2 | pool_guid_2',
      'pool_name_3 | pool_guid_3',
    ]);
  });

  // pools-dashboard opens this form through FormSidePanelService with `footerless: true`, which is
  // its only host: the form keeps its own Import button and closes through the `closed` output.
  it('imports a pool when form is submitted', async () => {
    const closed = jest.fn();
    spectator.component.closed.subscribe(closed);

    await (await getPoolSelect()).selectOption('pool_name_1 | pool_guid_1');

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(api.job).toHaveBeenCalledWith('pool.import_pool', [{ guid: 'pool_guid_1' }]);
    expect(closed).toHaveBeenCalledWith(true);
  });

  it('checks if pool needs to be unlocked and prompts user to unlock it', async () => {
    await (await getPoolSelect()).selectOption('pool_name_1 | pool_guid_1');

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [expect.objectContaining({ paths: ['pool_name_1'] })]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Unlock Pool',
    }));

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets', 'pewl', 'unlock']);
  });

  describe('with a configured pool that did not import', () => {
    // `pool.import_find` leaves out pools that are in the database, such as one whose SED disks were
    // locked at boot, so the wizard adds them from `pool.query` and imports them with `pool.reimport`.
    const offlinePool = {
      id: 7, name: 'sedpool', guid: 'sed_guid', status: PoolStatus.Offline,
    } as WebUiQueryEntity<'pool.query'>;

    const createComponentWithOfflinePool = createComponentFactory({
      component: ImportPoolComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockApi([
          mockJob('pool.import_find', { state: JobState.Success, result: [mockPools[0]] }),
          mockJob('pool.reimport', { state: JobState.Success, result: true }),
          mockQuery('pool.query', [offlinePool]),
          mockCall('disk.details', mockDiskDetailsNoLocked as unknown as DiskDetailsCallResponse),
          mockCall('system.advanced.sed_global_password', ''),
          mockCall('zfs.resource.list', [{ name: 'sedpool', pool: 'sedpool', type: 'FILESYSTEM' }] as ZfsResourceEntry[]),
        ]),
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(true)),
          jobDialog: jest.fn((job$) => ({
            afterClosed: () => job$,
          })),
        }),
        mockAuth(),
        mockProvider(Router),
      ],
    });

    let offlineSpectator: Spectator<ImportPoolComponent>;
    let offlineLoader: HarnessLoader;

    beforeEach(() => {
      offlineSpectator = createComponentWithOfflinePool();
      offlineLoader = TestbedHarnessEnvironment.loader(offlineSpectator.fixture);
    });

    function getOfflinePoolSelect(): Promise<TnSelectHarness> {
      return offlineLoader.getHarness(TnSelectHarness.with({ selector: '[formControlName="guid"]' }));
    }

    it('lists the offline configured pool after the pools that can be imported', async () => {
      expect(offlineSpectator.inject(ApiService).query)
        .toHaveBeenCalledWith('pool.query', [['status', '=', PoolStatus.Offline]]);
      expect(await (await getOfflinePoolSelect()).getOptions()).toEqual([
        'pool_name_1 | pool_guid_1',
        'sedpool | sed_guid (Offline, configured on this system)',
      ]);
    });

    it('imports the offline configured pool with pool.reimport', async () => {
      await (await getOfflinePoolSelect()).selectOption('sedpool | sed_guid (Offline, configured on this system)');

      const importButton = await offlineLoader.getHarness(TnButtonHarness.with({ label: 'Import' }));
      await importButton.click();

      const offlineApi = offlineSpectator.inject(ApiService);
      expect(offlineApi.job).toHaveBeenCalledWith('pool.reimport', [7]);
      expect(offlineApi.job).not.toHaveBeenCalledWith('pool.import_pool', expect.anything());
    });

    it('still imports a newly found pool with pool.import_pool', async () => {
      await (await getOfflinePoolSelect()).selectOption('pool_name_1 | pool_guid_1');

      const importButton = await offlineLoader.getHarness(TnButtonHarness.with({ label: 'Import' }));
      await importButton.click();

      expect(offlineSpectator.inject(ApiService).job).toHaveBeenCalledWith('pool.import_pool', [{ guid: 'pool_guid_1' }]);
    });
  });

  describe('while the initial lookup is in flight', () => {
    const createLoadingComponent = createComponentFactory({
      component: ImportPoolComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockApi([
          mockJob('pool.import_find', { state: JobState.Success, result: mockPools }),
        ]),
        // `disk.details` never settles, so the component stays on the step it opens on.
        mockProvider(ApiService, {
          call: jest.fn((method: string) => (
            method === 'disk.details' ? NEVER : of('existingpassword')
          )),
          job: jest.fn(() => of(fakeSuccessfulJob(mockPools))),
        }),
        mockProvider(DialogService),
        mockAuth(),
        mockProvider(Router),
      ],
    });

    it('shows a spinner and a message rather than an empty panel', () => {
      const loadingSpectator = createLoadingComponent();

      expect(loadingSpectator.query('tn-spinner')).toExist();
      expect(loadingSpectator.fixture.nativeElement.textContent)
        .toContain('Searching for pools available for import...');
    });
  });

  describe('with locked SED disks', () => {
    const createComponentWithLockedDisks = createComponentFactory({
      component: ImportPoolComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockApi([
          mockJob('pool.import_pool', { state: JobState.Success }),
          mockJob('pool.import_find', { state: JobState.Success, result: mockPools }),
          mockQuery('pool.query', []),
          mockCall('disk.details', mockDiskDetailsWithLocked as unknown as DiskDetailsCallResponse),
          mockCall('system.advanced.sed_global_password', 'existingpassword'),
          mockCall('disk.unlock_sed', null),
          mockCall('zfs.resource.list', [{ name: 'pewl', pool: 'pewl', type: 'FILESYSTEM' }] as ZfsResourceEntry[]),
        ]),
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(true)),
          jobDialog: jest.fn((job$) => ({
            afterClosed: () => job$,
          })),
        }),
        mockAuth(),
        mockProvider(Router),
      ],
    });

    it('shows locked SED disks screen when locked disks are detected and does not call pool.import_find yet', async () => {
      const lockedSpectator = createComponentWithLockedDisks();
      await lockedSpectator.fixture.whenStable();
      lockedSpectator.detectChanges();
      const lockedApi = lockedSpectator.inject(ApiService);

      expect(lockedSpectator.fixture.nativeElement.textContent).toContain('Locked SED Disks Detected');
      expect(lockedSpectator.fixture.nativeElement.textContent).not.toContain('Pool');
      expect(lockedApi.job).not.toHaveBeenCalledWith('pool.import_find');
    });

    it('calls pool.import_find and shows pool import form after skip is clicked', async () => {
      const lockedSpectator = createComponentWithLockedDisks();
      await lockedSpectator.fixture.whenStable();
      const lockedLoader = TestbedHarnessEnvironment.loader(lockedSpectator.fixture);
      const lockedApi = lockedSpectator.inject(ApiService);

      const skipButton = await lockedLoader.getHarness(TnButtonHarness.with({ label: 'Skip' }));
      await skipButton.click();

      expect(lockedApi.job).toHaveBeenCalledWith('pool.import_find');
      expect(lockedSpectator.fixture.nativeElement.textContent).not.toContain('Locked SED Disks Detected');
      expect(lockedSpectator.fixture.nativeElement.textContent).toContain('Pool');
    });

    it('shows unlock step when unlock is clicked', async () => {
      const lockedSpectator = createComponentWithLockedDisks();
      await lockedSpectator.fixture.whenStable();
      const lockedLoader = TestbedHarnessEnvironment.loader(lockedSpectator.fixture);

      const unlockButton = await lockedLoader.getHarness(TnButtonHarness.with({ label: 'Unlock' }));
      await unlockButton.click();

      expect(lockedSpectator.fixture.nativeElement.textContent).not.toContain('Locked SED Disks Detected');
      expect(lockedSpectator.fixture.nativeElement.textContent).toContain('Global SED Password');
    });
  });
});
