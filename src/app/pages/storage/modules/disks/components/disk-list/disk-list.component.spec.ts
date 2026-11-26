import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntitlements } from 'app/core/testing/utils/mock-entitlements.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk, DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent, DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import {
  BulkUnlockSedDialog,
} from 'app/pages/storage/modules/disks/components/disk-list/bulk-unlock-sed-dialog/bulk-unlock-sed-dialog.component';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import {
  ResetSedDialog,
} from 'app/pages/storage/modules/disks/components/disk-list/reset-sed-dialog/reset-sed-dialog.component';
import {
  UnlockSedDialog,
} from 'app/pages/storage/modules/disks/components/disk-list/unlock-sed-dialog/unlock-sed-dialog.component';
import {
  DiskWipeDialog,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('DiskListComponent', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const fakeDisks = [
    {
      identifier: 'identifier1',
      name: 'sda',
      serial: 'serial1',
      size: 42949672960,
      description: 'description1',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      model: 'Virtual_Disk_1',
      rotationrate: null,
      type: 'HDD',
      devname: 'sda',
      pool: 'boot-pool',
    },
    {
      identifier: 'identifier2',
      name: 'sdb',
      serial: 'serial2',
      size: 5368709120,
      description: 'description2',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      model: 'Virtual_Disk_2',
      rotationrate: null,
      type: 'SSD',
      devname: 'sdb',
      pool: null,
    },
    {
      identifier: 'identifier3',
      name: 'sdc',
      serial: 'serial3',
      size: 5368709120,
      description: 'description3',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      model: 'Virtual_Disk_3',
      rotationrate: null,
      type: 'HDD',
      devname: 'sdc',
      pool: null,
      sed: true,
    },
  ] as Disk[];

  const fakeUnusedDisks = [{
    identifier: 'identifier2',
    name: 'sdb',
    serial: 'serial2',
    size: 5368709120,
    model: 'Virtual_Disk',
    rotationrate: null,
    type: 'HDD',
    exported_zpool: 'test pool',
    devname: 'sdb',
  }] as DetailsDisk[];

  // SED status reaches the page through `disk.details`; the page-load `disk.query` does not ask for it.
  const fakeUsedDisks = [
    ...fakeUnusedDisks,
    { name: 'sdc', devname: 'sdc', sed_status: SedStatus.Locked },
  ] as DetailsDisk[];

  const createComponent = createComponentFactory({
    component: DiskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockEntitlements(),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('disk.query', fakeDisks),
        mockCall('disk.details', { unused: [], used: fakeUsedDisks }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows table rows', async () => {
    const expectedRows = [
      [
        '',
        'Name',
        'Serial',
        'Disk Size',
        'Pool',
        'Self-Encrypting Drive (SED)',
      ],
      [
        '',
        'sda',
        'serial1',
        '40 GiB',
        'boot-pool',
        'Unsupported',
      ],
      [
        '',
        'sdb',
        'serial2',
        '5 GiB',
        'test pool (Exported)',
        'Unsupported',
      ],
      [
        '',
        'sdc',
        'serial3',
        '5 GiB',
        'N/A',
        'Locked',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('leaves the SED status sweep to disk.details, so the drives are not probed twice at once', () => {
    const api = spectator.inject(ApiService);

    expect(api.call).toHaveBeenCalledWith('disk.details');
    expect(api.call).toHaveBeenCalledWith('disk.query', [[], { extra: { pools: true, passwords: true } }]);
    expect(api.call).toHaveBeenCalledTimes(2);
  });

  describe('a SED disk that disk.details left out', () => {
    const missingDisk = {
      ...fakeDisks[2], identifier: 'identifier4', name: 'sdd', devname: 'sdd',
    } as Disk;
    const probeParams = [[['name', 'in', ['sdd']]], { extra: { sed_status: true } }];

    it('is probed only once the details sweep is done', async () => {
      const api = spectator.inject(MockApiService);
      const details$ = new Subject<DiskDetailsResponse>();
      const mockedCall = api.call.getMockImplementation();
      api.call.mockImplementation((method: string, params: unknown) => {
        return method === 'disk.details' ? details$ : mockedCall(method, params);
      });
      api.mockCall('disk.query', (params) => {
        return params?.[0]?.length
          ? [{ ...missingDisk, sed_status: SedStatus.Unlocked }]
          : [...fakeDisks, missingDisk];
      });
      spectator = createComponent();

      expect(api.call).not.toHaveBeenCalledWith('disk.query', probeParams);

      details$.next({ unused: [], used: fakeUsedDisks });
      details$.complete();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);

      expect(api.call).toHaveBeenCalledWith('disk.query', probeParams);
      expect((await table.getCellTexts())[4]).toEqual(['', 'sdd', 'serial3', '5 GiB', 'N/A', 'Unlocked']);
    });

    it('is probed too when disk.details returned it without a status', () => {
      const api = spectator.inject(MockApiService);
      api.mockCall('disk.query', [...fakeDisks, missingDisk]);
      api.mockCall('disk.details', {
        unused: [],
        used: [...fakeUsedDisks, { name: 'sdd', devname: 'sdd' }] as DetailsDisk[],
      });
      spectator = createComponent();

      expect(api.call).toHaveBeenCalledWith('disk.query', probeParams);
    });

    it('still lists every disk when the probe fails, and logs why', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const api = spectator.inject(MockApiService);
      const mockedCall = api.call.getMockImplementation();
      api.call.mockImplementation((method: string, params: unknown) => {
        const isProbe = method === 'disk.query' && (params as unknown[][])[0].length;
        return isProbe ? throwError(() => new Error('SP_BUSY')) : mockedCall(method, params);
      });
      api.mockCall('disk.query', [...fakeDisks, missingDisk]);
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);

      expect((await table.getCellTexts())[4]).toEqual(['', 'sdd', 'serial3', '5 GiB', 'N/A', 'Unknown']);
      expect(consoleError).toHaveBeenCalledWith(new Error('SP_BUSY'));
      consoleError.mockRestore();
    });
  });

  it('opens edit form when Edit button is pressed', async () => {
    const fakeDisk = fakeDisks[0];
    await table.expandRow(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DiskFormComponent, { data: fakeDisk });
  });

  it('shows wipe disk dialog when Wipe button is pressed', async () => {
    const fakeDisk = fakeDisks[1];
    await table.expandRow(1);

    const manualTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'Wipe' }));
    await manualTestButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DiskWipeDialog, {
      data: {
        diskName: fakeDisk.name,
        exportedPool: fakeUnusedDisks[0].exported_zpool,
      },
    });
  });

  it('opens bulk edit form when multiple disks are selected and Edit is pressed', async () => {
    await table.selectRows([0, 1]);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit Disks' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      DiskBulkEditComponent,
      {
        data: [
          expect.objectContaining({
            name: 'sda',
          }),
          expect.objectContaining({
            name: 'sdb',
          }),
        ],
      },
    );
  });

  it('offers a bulk SED unlock only while the selection holds a locked SED', async () => {
    await table.selectRows([0, 1]);

    expect(await loader.getHarnessOrNull(MatButtonHarness.with({ text: /^Unlock SED/ }))).toBeNull();

    await table.selectRows([2]);

    expect(await loader.getHarness(MatButtonHarness.with({ text: 'Unlock SED' }))).toBeTruthy();
  });

  it('opens the bulk unlock dialog with the whole selection and reloads once it closes with unlocked disks', async () => {
    await table.selectRows([1, 2]);
    jest.spyOn(spectator.inject(ApiService), 'call').mockClear();

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock SED' }));
    await unlockButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(BulkUnlockSedDialog, {
      data: {
        disks: [
          expect.objectContaining({ name: 'sdb' }),
          expect.objectContaining({ name: 'sdc', sed_status: SedStatus.Locked }),
        ],
      },
      disableClose: true,
    });
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.details');
  });

  it('shows unlock SED dialog when Unlock button is pressed for locked SED disk', async () => {
    await table.expandRow(2);

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(UnlockSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('shows reset SED dialog when SED Reset button is pressed for locked SED disk', async () => {
    await table.expandRow(2);

    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'SED Reset' }));
    await resetButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ResetSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it.each([
    SedStatus.Unlocked,
    SedStatus.Uninitialized,
    SedStatus.Failed,
  ])('offers SED Reset but not Unlock for a %s SED disk', async (sedStatus) => {
    spectator.inject(MockApiService).mockCall('disk.details', {
      unused: [],
      used: [{ name: 'sdc', devname: 'sdc', sed_status: sedStatus }] as DetailsDisk[],
    });
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
    await table.expandRow(2);

    expect(await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Unlock' }))).toBeNull();

    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'SED Reset' }));
    await resetButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ResetSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('does not offer SED Reset for a disk without SED support', async () => {
    await table.expandRow(1);

    expect(await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'SED Reset' }))).toBeNull();
  });

  it('updates disks when edit form is saved', async () => {
    const api = spectator.inject(ApiService);
    const slideIn = spectator.inject(SlideIn);
    const fakeDisk = fakeDisks[0];

    const mockUpd: DiskFormResponse = [fakeDisk];
    const mockSlideInRef$ = of({ response: mockUpd, error: null });

    jest.spyOn(slideIn, 'open').mockReturnValue(mockSlideInRef$);

    await table.expandRow(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(slideIn.open).toHaveBeenCalledWith(DiskFormComponent, { data: fakeDisk });

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('disk.query', expect.anything());
    expect(api.call).toHaveBeenCalledWith('disk.details');
  });
});

describe('DiskListComponent - not entitled to SED', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const fakeDisks = [
    {
      identifier: 'identifier1',
      name: 'sda',
      serial: 'serial1',
      size: 42949672960,
      pool: 'boot-pool',
    },
  ] as Disk[];

  const createComponent = createComponentFactory({
    component: DiskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog),
      mockEntitlements([EntitlementFeature.Sed]),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('disk.query', fakeDisks),
        mockCall('disk.details', { unused: [], used: [] }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('hides SED column when hasSed$ is false', async () => {
    const cells = await table.getCellTexts();
    const headerRow = cells[0];

    expect(headerRow).not.toContain('Self-Encrypting Drive (SED)');
    expect(headerRow).toEqual(['', 'Name', 'Serial', 'Disk Size', 'Pool']);
  });

  it('does not offer the SED column in the Columns menu', async () => {
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
    const itemTexts = await Promise.all((await menu.getItems()).map((item) => item.getText()));

    expect(itemTexts).toContain('Pool');
    expect(itemTexts.some((text) => text.includes('Self-Encrypting Drive (SED)'))).toBe(false);
  });

  it('does not show the SED column even when saved column preferences include it', async () => {
    spectator.inject(MockStore).overrideSelector(selectPreferences, {
      tableDisplayedColumns: [{
        title: 'diskList',
        columns: ['Name', 'Serial', 'Self-Encrypting Drive (SED)'],
      }],
    } as Preferences);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);

    const cells = await table.getCellTexts();
    expect(cells[0]).toEqual(['', 'Name', 'Serial']);
  });

  it('offers no SED actions, even when disk.details reports a status', async () => {
    const api = spectator.inject(MockApiService);
    api.mockCall('disk.query', [{ ...fakeDisks[0], sed: true }] as Disk[]);
    api.mockCall('disk.details', {
      unused: [],
      used: [{ name: 'sda', devname: 'sda', sed_status: SedStatus.Locked }] as DetailsDisk[],
    });
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
    await table.expandRow(0);

    expect(await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Unlock' }))).toBeNull();
    expect(await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'SED Reset' }))).toBeNull();
  });

  it('does not probe a SED disk that disk.details left out', () => {
    const api = spectator.inject(MockApiService);
    api.mockCall('disk.query', [{ ...fakeDisks[0], sed: true }] as Disk[]);
    spectator = createComponent();

    expect(api.call).not.toHaveBeenCalledWith('disk.query', [expect.anything(), { extra: { sed_status: true } }]);
  });
});

describe('DiskListComponent - unlocking the disks of a pool that did not import', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;

  // Disks of a configured pool that failed to import at boot have no `pool`; `disk.details` reports
  // the pool they belong to as `exported_zpool`.
  const lockedDisk = (name: string): DetailsDisk => ({
    name, devname: name, exported_zpool: 'sedpool', sed_status: SedStatus.Locked,
  } as DetailsDisk);

  const listedDisk = (name: string): Disk => ({
    identifier: name, name, devname: name, serial: name, size: 5368709120, pool: null, sed: true,
  } as Disk);

  const offlinePool = { id: 7, name: 'sedpool', status: PoolStatus.Offline } as Pool;

  // The list loads as the component is built, so each scenario needs its own disks up front.
  function createFactory(
    diskNames: string[],
    configuredPools: Pool[],
  ): () => Spectator<DiskListComponent> {
    return createComponentFactory({
      component: DiskListComponent,
      imports: [
        MockComponent(PageHeaderComponent),
        BasicSearchComponent,
        IxTableColumnsSelectorComponent,
        IxTableDetailsRowDirective,
        IxTableDetailsRowComponent,
      ],
      providers: [
        mockAuth(),
        mockProvider(Router),
        mockProvider(SlideIn, {
          open: jest.fn(() => of()),
        }),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: jest.fn(() => of(true)),
          })),
        }),
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(true)),
          jobDialog: jest.fn(() => ({ afterClosed: () => of(fakeSuccessfulJob(true)) })),
        }),
        mockEntitlements(),
        provideMockStore({
          selectors: [{ selector: selectPreferences, value: {} }],
        }),
        mockApi([
          mockCall('disk.query', diskNames.map(listedDisk)),
          mockCall('disk.details', { unused: [], used: diskNames.map(lockedDisk) }),
          mockCall('pool.query', configuredPools),
          mockJob('pool.reimport', fakeSuccessfulJob(true)),
        ]),
      ],
    });
  }

  async function unlockFirstDisk(): Promise<void> {
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const table = await loader.getHarness(IxTableHarness);
    await table.expandRow(0);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Unlock' }))).click();
  }

  describe('when the last locked disk of a configured pool is unlocked', () => {
    const createComponent = createFactory(['sdc'], [offlinePool]);

    it('offers to import the pool and imports it with pool.reimport', async () => {
      spectator = createComponent();

      await unlockFirstDisk();

      const api = spectator.inject(ApiService);
      expect(api.call).toHaveBeenCalledWith('pool.query', [[['name', '=', 'sedpool'], ['status', '=', PoolStatus.Offline]]]);
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Import Pool',
        message: 'The SED disks of pool sedpool are unlocked. Import the pool now to bring it back online?',
      }));
      expect(api.job).toHaveBeenCalledWith('pool.reimport', [7]);
    });
  });

  describe('for a user who can unlock disks but not write to pools', () => {
    const createComponent = createFactory(['sdc'], [offlinePool]);

    it('does not offer an import that pool.reimport would refuse', async () => {
      spectator = createComponent();
      // The mock grants every role by default; this user has disk write only.
      spectator.inject(MockAuthService).hasRole.mockImplementation(
        (roles: Role[]) => of(roles.every((role) => role === Role.DiskWrite)),
      );

      await unlockFirstDisk();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('pool.query', expect.anything());
      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
    });
  });

  describe('while another disk of the pool is still locked', () => {
    const createComponent = createFactory(['sdc', 'sdd'], [offlinePool]);

    it('does not offer the import', async () => {
      spectator = createComponent();

      await unlockFirstDisk();

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
      expect(spectator.inject(ApiService).job).not.toHaveBeenCalledWith('pool.reimport', expect.anything());
    });
  });

  describe('when the disks belong to a pool that is not configured on the system', () => {
    const createComponent = createFactory(['sdc'], []);

    it('does not offer the import', async () => {
      spectator = createComponent();

      await unlockFirstDisk();

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
    });
  });
});
