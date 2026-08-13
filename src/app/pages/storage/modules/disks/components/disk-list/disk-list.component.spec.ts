import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnEmptyHarness, TnSelectHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { NEVER, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { BasicSearchHarness } from 'app/modules/forms/search-input/components/basic-search/basic-search.harness';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import {
  TableColumnPickerComponent,
} from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
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
      hddstandby: '120',
      advpowermgmt: '64',
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
      hddstandby: '20',
      advpowermgmt: '254',
      model: 'Virtual_Disk_2',
      rotationrate: null,
      type: 'SSD',
      devname: 'sdb',
      pool: null,
      // A disk that reports a status but doesn't support SED still renders as "Unsupported" —
      // which is exactly where the raw column value and the displayed text diverge.
      sed: false,
      sed_status: SedStatus.Failed,
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
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
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

  it('keeps the legacy row-action test ids after moving to tn-button', async () => {
    await table.toggleRowExpansion(2);

    expect(spectator.query('[data-test="button-sdc-edit"]')).toExist();
    expect(spectator.query('[data-test="button-sdc-unlock"]')).toExist();
    expect(spectator.query('[data-test="button-sdc-reset-sed"]')).toExist();
  });

  it('keeps splitting letter-digit boundaries in row-action test ids, as lodash kebab-case did', async () => {
    spectator.inject(MockApiService).mockCall(
      'disk.query',
      [{ ...fakeDisks[0], name: 'nvme0n1', devname: 'nvme0n1' }] as Disk[],
    );
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);

    await table.toggleRowExpansion(0);

    // Handing the raw name to the library's test-id kebab would resolve `button-nvme0n1-edit`.
    expect(spectator.query('[data-test="button-nvme-0-n-1-edit"]')).toExist();
  });

  // The two assertions below query `data-test` on purpose: the e2e suite locates these buttons
  // by the ids the pre-migration screen resolved, so preserving them is the assertion itself.
  it('keeps the legacy batch-operations test id after moving to tn-button', async () => {
    await table.toggleRowSelection(0);

    expect(spectator.query('[data-test="button-edit-selected"]')).toExist();
  });

  it('keeps only one detail row open at a time', async () => {
    await table.toggleRowExpansion(0);

    expect(await table.isRowExpanded(0)).toBe(true);

    await table.toggleRowExpansion(1);

    expect(await table.isRowExpanded(0)).toBe(false);
    expect(await table.isRowExpanded(1)).toBe(true);
  });

  it('opens edit form when Edit button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(DiskFormComponent, {
      title: 'Edit Disk',
      inputs: { diskToEdit: expect.objectContaining({ name: 'sda' }) },
    });
  });

  it('shows wipe disk dialog when Wipe button is pressed', async () => {
    const fakeDisk = fakeDisks[1];
    await table.toggleRowExpansion(1);

    const wipeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Wipe' }));
    await wipeButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DiskWipeDialog, {
      data: {
        diskName: fakeDisk.name,
        exportedPool: fakeUnusedDisks[0].exported_zpool,
      },
    });
  });

  it('drops the selection when a row action reloads the list', async () => {
    // The reload rebuilds every row and tn-table drops its own checkboxes with them; the batch
    // bar has to go with them, or it sits there claiming disks that are no longer ticked.
    await table.toggleRowSelection(0);
    await table.toggleRowSelection(1);
    expect(spectator.query('.batch-actions-toolbar')).toExist();

    await table.toggleRowExpansion(1);
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Wipe' }))).click();

    expect(spectator.query('.batch-actions-toolbar')).not.toExist();
    // Both halves, not just ours: tn-table clears its own SelectionModel on a `[dataSource]`
    // swap, and the batch bar disappearing while the boxes stay ticked is the same desync.
    expect(await table.getSelectedRowCount()).toBe(0);
  });

  it('drops the selection when the rows change, so a row cannot come back pre-selected', async () => {
    // The selection is held by identifier: without clearing it when the row set changes, a disk
    // filtered away and brought back would return selected in the batch bar with its checkbox
    // unticked — and Edit would act on a disk the user never picked.
    await table.toggleRowSelection(0);
    expect(spectator.query('.batch-actions-toolbar')).toExist();

    await (await loader.getHarness(BasicSearchHarness)).setValue('nonexistent-disk');
    spectator.detectChanges();

    // The no-results state's Reset clears the search and brings every row back.
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Reset' }))).click();
    spectator.detectChanges();

    const rebuilt = await loader.getHarness(TnTableHarness);
    expect(await rebuilt.getRowCount()).toBe(3);
    expect(spectator.query('.batch-actions-toolbar')).not.toExist();
    expect(await rebuilt.getSelectedRowCount()).toBe(0);
  });

  it('names how many disks the batch bar is acting on', async () => {
    // The selection only ever covers the rows on screen (tn-table clears it when the page or
    // search changes), so the count has to be visible rather than assumed.
    await table.toggleRowSelection(0);

    expect(spectator.query('.batch-actions-toolbar .title').textContent).toContain('1 disk selected');

    await table.toggleRowSelection(1);

    expect(spectator.query('.batch-actions-toolbar .title').textContent).toContain('2 disks selected');
  });

  it('announces the count from a live region that predates the first selection', async () => {
    // The region has to already be in the DOM and empty: one inserted with its text isn't
    // announced, which would silently drop the 0 -> 1 announcement.
    const liveRegion = spectator.query('[aria-live="polite"]');
    expect(liveRegion).toExist();
    expect(liveRegion.textContent.trim()).toBe('');

    await table.toggleRowSelection(0);

    expect(liveRegion.textContent).toContain('1 disk selected');

    // And closes the loop the other way: deselecting the last disk says so instead of the
    // region simply going quiet.
    await table.toggleRowSelection(0);

    expect(liveRegion.textContent).toContain('No disks selected');
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
            expect.objectContaining({ name: 'sda' }),
            expect.objectContaining({ name: 'sdb' }),
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

  it('reloads disks when edit form is saved', async () => {
    const api = spectator.inject(ApiService);
    const formPanel = spectator.inject(FormSidePanelService);

    const mockUpd: DiskFormResponse = [{ identifier: 'identifier1', description: 'updated' }];
    jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(mockUpd));

    await table.toggleRowExpansion(0);

    // the initial load already called both endpoints, so only count what the save triggers
    (api.call as jest.Mock).mockClear();

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('disk.query', expect.anything());
    expect(api.call).toHaveBeenCalledWith('disk.details');
  });

  it('reconciles the edited row immediately, without waiting for the reload', async () => {
    const api = spectator.inject(ApiService);
    const formPanel = spectator.inject(FormSidePanelService);

    const mockUpd: DiskFormResponse = [{ identifier: 'identifier1', pool: 'new-pool' }];
    jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(mockUpd));

    await table.toggleRowExpansion(0);

    // Against a real middleware the reload takes 5-10s; keep it pending so the optimistic
    // update the save performs is what the table shows.
    (api.call as jest.Mock).mockReturnValue(NEVER);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const rows = await table.getAllRowTexts();
    expect(rows[0]).toEqual(['sda', 'serial1', '40 GiB', 'new-pool', 'Unsupported']);
  });

  it('sorts Disk Size by the raw byte count, not by the formatted text', async () => {
    await table.clickSortHeader('size');

    // '40 GiB' sorts before '5 GiB' as text; ascending by bytes puts the 5 GiB disks first.
    expect((await table.getAllRowTexts()).map((row) => row[2])).toEqual(['5 GiB', '5 GiB', '40 GiB']);

    await table.clickSortHeader('size');

    expect((await table.getAllRowTexts()).map((row) => row[2])).toEqual(['40 GiB', '5 GiB', '5 GiB']);
  });

  it('sorts the SED column by the status text it shows, not by the raw enum', async () => {
    await table.clickSortHeader('sed_status');

    // Sorting by the raw `sed_status` would lead with sdb (FAILED), even though the cell
    // shows it as "Unsupported" like sda, which has no raw value at all.
    expect((await table.getAllRowTexts()).map((row) => [row[0], row[4]])).toEqual([
      ['sdc', 'Locked'],
      ['sda', 'Unsupported'],
      ['sdb', 'Unsupported'],
    ]);

    await table.clickSortHeader('sed_status');

    expect((await table.getAllRowTexts()).map((row) => row[4]))
      .toEqual(['Unsupported', 'Unsupported', 'Locked']);
  });

  it('sorts the timeout columns numerically, not by the digits they render', async () => {
    // Both columns are hidden by default, so reveal them through the picker first.
    const picker = await loader.getHarness(TnSelectHarness);
    await picker.selectOption('HDD Standby');
    await picker.selectOption('Adv. Power Management');
    await picker.close();
    spectator.detectChanges();

    await table.clickSortHeader('hddstandby');

    // The enum values are minute counts held as strings: as text '120' sorts before '20'.
    expect((await table.getAllRowTexts()).map((row) => [row[0], row[4]])).toEqual([
      ['sdb', '20'],
      ['sda', '120'],
      ['sdc', 'Always On'],
    ]);

    await table.clickSortHeader('advpowermgmt');

    // Same for power levels — as text '254' sorts before '64'.
    expect((await table.getAllRowTexts()).map((row) => [row[0], row[5]])).toEqual([
      ['sdc', 'Disabled'],
      ['sda', '64'],
      ['sdb', '254'],
    ]);
  });

  it('keeps the sort indicator after the list empties out and comes back', async () => {
    await table.clickSortHeader('size');

    expect(await table.getSortDirection('size')).toBe('ascending');

    // Searching down to no results destroys the table; clearing the search builds a new one,
    // which starts with no arrow of its own even though the rows are still sorted.
    await (await loader.getHarness(BasicSearchHarness)).setValue('nonexistent-disk');
    spectator.detectChanges();
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Reset' }))).click();
    spectator.detectChanges();

    const rebuiltTable = await loader.getHarness(TnTableHarness);

    expect((await rebuiltTable.getAllRowTexts()).map((row) => row[2])).toEqual(['5 GiB', '5 GiB', '40 GiB']);
    expect(await rebuiltTable.getSortDirection('size')).toBe('ascending');
  });

  it('searches Disk Size by a human size, not only by the raw byte count', async () => {
    // The filter keys on `size` (the raw number), which `filterTableRows` special-cases: it
    // parses the query as a disk size and matches within 5%. So the formatted text the cell
    // shows is searchable without keying the filter on `sizeText`.
    const search = await loader.getHarness(BasicSearchHarness);
    await search.setValue('40 GiB');
    spectator.detectChanges();

    expect(await table.getAllRowTexts()).toEqual([
      expect.arrayContaining(['sda', '40 GiB']),
    ]);
  });

  it('replaces the table with a no-results empty state, whose action resets the search', async () => {
    const search = await loader.getHarness(BasicSearchHarness);
    await search.setValue('nonexistent-disk');
    spectator.detectChanges();

    const empty = await loader.getHarness(TnEmptyHarness);

    expect(await empty.getTitle()).toBe('No Search Results.');
    expect(await loader.getAllHarnesses(TnTableHarness)).toHaveLength(0);

    await (await loader.getHarness(TnButtonHarness.with({ label: 'Reset' }))).click();
    spectator.detectChanges();

    expect(await loader.getAllHarnesses(TnEmptyHarness)).toHaveLength(0);
    expect(await (await loader.getHarness(TnTableHarness)).getRowCount()).toBe(3);
  });

  it('drops a selection the save invalidated instead of reusing pre-edit rows', async () => {
    const formPanel = spectator.inject(FormSidePanelService);
    jest.spyOn(formPanel, 'open').mockReturnValue(
      SlideInResult.success([{ identifier: 'identifier1', pool: 'new-pool' }] as DiskFormResponse),
    );

    await table.toggleRowSelection(0);
    await table.toggleRowSelection(1);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit Disks' }));
    await editButton.click();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    // A save invalidates the selection it was made from, so the batch bar (and with it the
    // stale disks it would have edited) goes away. The checkboxes go with it: the optimistic
    // `setRows` hands tn-table a fresh array, whose reference change clears its own
    // SelectionModel — it keys on row references, not on the `[trackBy]` identifiers.
    expect(await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Edit Disks' }))).toHaveLength(0);
    expect(await (await loader.getHarness(TnTableHarness)).getSelectedRowCount()).toBe(0);
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
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
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
