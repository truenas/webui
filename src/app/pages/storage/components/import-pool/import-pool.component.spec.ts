import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
import { NEVER, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedJob, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ImportPoolComponent } from './import-pool.component';

type DiskDetailsCallResponse = CallResponse<WebUiApiDirectory, 'disk.details'>;

describe('ImportPoolComponent', () => {
  let spectator: Spectator<ImportPoolComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;

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
      mockTypedApi([
        mockTypedJob('pool.import_pool', { state: JobState.Success }),
        mockTypedJob('pool.import_find', { state: JobState.Success, result: mockPools }),
        mockTypedCall('disk.details', mockDiskDetailsNoLocked as unknown as DiskDetailsCallResponse),
        mockTypedCall('system.advanced.sed_global_password', 'existingpassword'),
        mockTypedQuery('pool.dataset.query', [{
          id: '/mnt/pewl',
          locked: true,
          encryption_root: '/mnt/pewl',
        } as WebUiQueryEntity<'pool.dataset.query'>]),
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
    api = spectator.inject(TypedApiService);
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

    expect(api.query).toHaveBeenCalledWith('pool.dataset.query', [['name', '=', 'pool_name_1']]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Unlock Pool',
    }));

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets', '/mnt/pewl', 'unlock']);
  });

  describe('while the initial lookup is in flight', () => {
    const createLoadingComponent = createComponentFactory({
      component: ImportPoolComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockTypedApi([
          mockTypedJob('pool.import_find', { state: JobState.Success, result: mockPools }),
        ]),
        // `disk.details` never settles, so the component stays on the step it opens on.
        mockProvider(TypedApiService, {
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
        mockTypedApi([
          mockTypedJob('pool.import_pool', { state: JobState.Success }),
          mockTypedJob('pool.import_find', { state: JobState.Success, result: mockPools }),
          mockTypedCall('disk.details', mockDiskDetailsWithLocked as unknown as DiskDetailsCallResponse),
          mockTypedCall('system.advanced.sed_global_password', 'existingpassword'),
          mockTypedCall('disk.unlock_sed', null),
          mockTypedQuery('pool.dataset.query', [{ id: '/mnt/pewl', locked: false } as WebUiQueryEntity<'pool.dataset.query'>]),
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
      const lockedApi = lockedSpectator.inject(TypedApiService);

      expect(lockedSpectator.fixture.nativeElement.textContent).toContain('Locked SED Disks Detected');
      expect(lockedSpectator.fixture.nativeElement.textContent).not.toContain('Pool');
      expect(lockedApi.job).not.toHaveBeenCalledWith('pool.import_find');
    });

    it('calls pool.import_find and shows pool import form after skip is clicked', async () => {
      const lockedSpectator = createComponentWithLockedDisks();
      await lockedSpectator.fixture.whenStable();
      const lockedLoader = TestbedHarnessEnvironment.loader(lockedSpectator.fixture);
      const lockedApi = lockedSpectator.inject(TypedApiService);

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
