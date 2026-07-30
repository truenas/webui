import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnEmptyHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { NEVER, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import {
  TableColumnPickerComponent,
} from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent, DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
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
import { LicenseService } from 'app/services/license.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('DiskListComponent', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
      sed_status: SedStatus.Locked,
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

  const createComponent = createComponentFactory({
    component: DiskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      TableColumnPickerComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
          close: jest.fn(),
        }) as unknown as DialogRef),
      }),
      mockProvider(LicenseService, {
        hasSed$: of(true),
      }),
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
        mockCall('disk.details', { unused: [], used: fakeUnusedDisks }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Name',
      'Serial',
      'Disk Size',
      'Pool',
      'Self-Encrypting Drive (SED)',
    ]);

    expect(await table.getAllRowTexts()).toEqual([
      ['sda', 'serial1', '40 GiB', 'boot-pool', 'Unsupported'],
      ['sdb', 'serial2', '5 GiB', 'test pool (Exported)', 'Unsupported'],
      ['sdc', 'serial3', '5 GiB', 'N/A', 'Locked'],
    ]);
  });

  it('opens edit form when Edit button is pressed', async () => {
    const fakeDisk = fakeDisks[0];
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(DiskFormComponent, {
      title: 'Edit Disk',
      inputs: { diskToEdit: fakeDisk },
    });
  });

  it('shows wipe disk dialog when Wipe button is pressed', async () => {
    const fakeDisk = fakeDisks[1];
    await table.toggleRowExpansion(1);

    const manualTestButton = await loader.getHarness(TnButtonHarness.with({ label: 'Wipe' }));
    await manualTestButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DiskWipeDialog, {
      data: {
        diskName: fakeDisk.name,
        exportedPool: fakeUnusedDisks[0].exported_zpool,
      },
    });
  });

  it('opens bulk edit form when multiple disks are selected and Edit is pressed', async () => {
    await table.toggleRowSelection(0);
    await table.toggleRowSelection(1);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit Disks' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      DiskBulkEditComponent,
      {
        title: 'Bulk Edit Disks',
        inputs: {
          disksToEdit: [
            expect.objectContaining({
              name: 'sda',
            }),
            expect.objectContaining({
              name: 'sdb',
            }),
          ],
        },
      },
    );
  });

  it('shows unlock SED dialog when Unlock button is pressed for locked SED disk', async () => {
    await table.toggleRowExpansion(2);

    const unlockButton = await loader.getHarness(TnButtonHarness.with({ label: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(UnlockSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('shows reset SED dialog when SED Reset button is pressed for locked SED disk', async () => {
    await table.toggleRowExpansion(2);

    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: 'SED Reset' }));
    await resetButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ResetSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('reconciles the edited disk into the table while the reload is still in flight', async () => {
    const api = spectator.inject(ApiService);
    const formPanel = spectator.inject(FormSidePanelService);

    const mockUpd: DiskFormResponse = [{
      identifier: 'identifier1',
      description: 'Updated description',
    }];

    jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(mockUpd));

    await table.toggleRowExpansion(0);

    // Hold the post-save reload open so this observes the optimistic reconcile rather than
    // the reloaded server rows — the 5-10s window production users actually see. With a
    // synchronous mock the reload would overwrite it instantly and the assertion would
    // pass on data that never went through diskUpdates$.
    jest.spyOn(api, 'call').mockReturnValue(NEVER);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(formPanel.open).toHaveBeenCalledWith(DiskFormComponent, {
      title: 'Edit Disk',
      inputs: { diskToEdit: fakeDisks[0] },
    });

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    // setRows() hands the table fresh row objects, which drops the expansion state.
    await table.toggleRowExpansion(0);

    // `description` is a hidden column, so the reconciled value surfaces in the detail row.
    expect(await table.getDetailRowContent(0)).toContain('Updated description');
  });

  it('sorts by the clicked column', async () => {
    await table.clickSortHeader('name');

    expect(await table.getSortDirection('name')).toBe('ascending');
    expect((await table.getAllRowTexts()).map((row) => row[0])).toEqual(['sda', 'sdb', 'sdc']);
  });

  it('shows hidden column values in the expanded detail row', async () => {
    await table.toggleRowExpansion(0);

    expect(await table.isRowExpanded(0)).toBe(true);

    const details = await table.getDetailRowContent(0);
    expect(details).toContain('description1');
    expect(details).toContain('Virtual_Disk_1');
  });
});

describe('DiskListComponent - empty states', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;

  const makeFactory = (disks: Disk[]): ReturnType<typeof createComponentFactory<DiskListComponent>> => (
    createComponentFactory({
      component: DiskListComponent,
      imports: [
        MockComponent(PageHeaderComponent),
        BasicSearchComponent,
        TableColumnPickerComponent,
      ],
      providers: [
        mockAuth(),
        mockProvider(Router),
        mockProvider(FormSidePanelService, {
          open: jest.fn(() => SlideInResult.empty()),
        }),
        mockProvider(TnDialog),
        mockProvider(LicenseService, {
          hasSed$: of(false),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectPreferences,
              value: {},
            },
          ],
        }),
        mockApi([
          mockCall('disk.query', disks),
          mockCall('disk.details', { unused: [], used: [] }),
        ]),
      ],
    })
  );

  describe('when the server returns no disks', () => {
    const createComponent = makeFactory([]);

    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();
    });

    it('shows the no-records empty state with no recovery action', async () => {
      const empty = await loader.getHarness(TnEmptyHarness);

      expect(await empty.getTitle()).toBe('No records have been added yet');
      expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Reset' }))).toBeNull();
    });
  });

  describe('when a search matches none of the loaded disks', () => {
    const createComponent = makeFactory([
      { identifier: 'identifier1', name: 'sda', pool: 'boot-pool' } as Disk,
    ]);

    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      spectator.query(BasicSearchComponent).queryChange.emit('nonexistent-disk');
      spectator.detectChanges();
      await spectator.fixture.whenStable();
    });

    it('offers a Reset action that clears the search and brings the table back', async () => {
      const empty = await loader.getHarness(TnEmptyHarness);
      expect(await empty.getTitle()).toBe('No Search Results.');

      const resetButton = await loader.getHarness(TnButtonHarness.with({ label: 'Reset' }));
      await resetButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(await loader.getHarnessOrNull(TnEmptyHarness)).toBeNull();
      expect(await (await loader.getHarness(TnTableHarness)).getRowCount()).toBe(1);
    });
  });
});

describe('DiskListComponent - without SED license', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
      TableColumnPickerComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog),
      mockProvider(LicenseService, {
        hasSed$: of(false),
      }),
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
    table = await loader.getHarness(TnTableHarness);
  });

  it('hides SED column when hasSed$ is false', async () => {
    const headerRow = await table.getHeaderTexts();

    expect(headerRow).not.toContain('Self-Encrypting Drive (SED)');
    expect(headerRow).toEqual(['Name', 'Serial', 'Disk Size', 'Pool']);
  });
});
