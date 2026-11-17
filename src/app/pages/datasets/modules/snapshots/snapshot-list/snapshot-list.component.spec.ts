import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Location } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnChipHarness, TnSlideToggleHarness, TnTableHarness, TnTablePagerHarness,
} from '@truenas/ui-components';
import { MockComponent, ngMocks } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockApi, mockCall, mockQuery } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { snapshotsInitialState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import { selectSnapshotState, selectSnapshots, selectSnapshotsTotal } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { fakeZfsSnapshotDataSource } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { SnapshotListComponent } from './snapshot-list.component';

describe('SnapshotListComponent', () => {
  let spectator: Spectator<SnapshotListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      ReactiveFormsModule,
      MockComponent(IxDateComponent),
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockQuery('pool.snapshot.query', fakeZfsSnapshotDataSource as unknown as WebUiQueryEntity<'pool.snapshot.query'>[]),
        mockCall('pool.snapshot.delete', null),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(Location),
      provideMockStore({
        selectors: [
          {
            selector: selectSnapshotState,
            value: snapshotsInitialState,
          },
          {
            selector: selectSnapshots,
            value: fakeZfsSnapshotDataSource,
          },
          {
            selector: selectSnapshotsTotal,
            value: fakeZfsSnapshotDataSource.length,
          },
          {
            selector: selectPreferences,
            value: {
              showSnapshotExtraColumns: false,
            },
          },
          {
            selector: selectGeneralConfig,
            value: {
              timezone: 'Europe/Kiev',
            },
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-dataset', // represents the dataset
              },
            },
          },
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  /**
   * Feeds the component through the store, the way the real page gets its rows. `snapshots`
   * is private precisely so it can't be written behind `setSnapshots`, which is what keeps
   * the name index and the selection in step with the list.
   */
  function setSnapshots(snapshots: ZfsSnapshot[]): void {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectSnapshots, snapshots);
    store$.refreshState();
    spectator.detectChanges();
  }

  it('should show table rows', async () => {
    expect(await table.getRowCount()).toBe(2);

    expect(await table.getCellText(0, 'dataset')).toBe('test-dataset');
    expect(await table.getCellText(0, 'snapshot_name')).toBe('second-snapshot');
    expect(await table.getCellText(1, 'dataset')).toBe('test-dataset');
    expect(await table.getCellText(1, 'snapshot_name')).toBe('first-snapshot');
  });

  it('should show table with extra columns', async () => {
    const slideToggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Show extra columns' }));
    await slideToggle.toggle();

    // The real flow reloads snapshots via an effect and flips loading off on
    // `snapshotsLoaded`; there is no effect in the test, so release it manually.
    spectator.component.loadingExtraColumns$.next(false);
    spectator.detectChanges();

    expect(await table.getHeaderTexts()).toEqual(
      expect.arrayContaining(['Dataset', 'Snapshot', 'Used', 'Date created', 'Referenced']),
    );
    expect(await table.getCellText(0, 'used')).toBe('1.49 TiB');
    expect(await table.getCellText(0, 'referenced')).toBe('1.49 TiB');
  });

  it('tags every cell with the row it belongs to, so a row is addressable in e2e', async () => {
    const slideToggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Show extra columns' }));
    await slideToggle.toggle();
    spectator.component.loadingExtraColumns$.next(false);
    spectator.detectChanges();

    const testIds = Array.from(spectator.queryAll('tbody tr:first-child [data-test]'))
      .map((element) => element.getAttribute('data-test'));

    expect(testIds).toEqual([
      // The tick box and the chevron are drawn by tn-table, and scoped by the same row tag.
      'checkbox-select-snapshot-test-dataset-second-snapshot',
      'text-dataset-snapshot-test-dataset-second-snapshot-row-text',
      'text-snapshot-snapshot-test-dataset-second-snapshot-row-text',
      'text-used-snapshot-test-dataset-second-snapshot-row-size',
      // `date-date-created-…` before the migration: the library's composeTestId drops a base
      // segment that repeats the type prefix, so this one id is a rename, not a restoration.
      'date-created-snapshot-test-dataset-second-snapshot-row-date',
      'text-referenced-snapshot-test-dataset-second-snapshot-row-size',
      'button-expand-snapshot-test-dataset-second-snapshot',
    ]);
  });

  it('tags the row itself with the snapshot it shows, so e2e can address the row rather than a cell', () => {
    const row = spectator.query('tbody tr[data-test]');

    expect(row?.getAttribute('data-test')).toBe('row-snapshot-test-dataset-second-snapshot');
  });

  it('snaps the extra-columns toggle back when the confirmation is cancelled', async () => {
    // Model the real async confirm dialog: the toggle flips on optimistically, then
    // the user cancels. tn-slide-toggle latches its visual state internally, so this
    // proves the control value is written back (not merely that the signal stayed
    // false) — with the old markForCheck-only revert the switch stays stuck on.
    const confirmResult$ = new Subject<boolean>();
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(confirmResult$);
    const slideToggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Show extra columns' }));

    await slideToggle.toggle();
    spectator.detectChanges();
    expect(await slideToggle.isChecked()).toBe(true);

    confirmResult$.next(false);
    spectator.detectChanges();

    expect(await slideToggle.isChecked()).toBe(false);
    expect(await table.getHeaderTexts()).not.toContain('Used');
  });

  it('keeps the current selection when the snapshot list reloads', async () => {
    const store$ = spectator.inject(MockStore);

    await table.toggleRowSelection(0);
    expect(await table.getSelectedRowCount()).toBe(1);

    // A store re-emission hands back fresh row objects. Keyed by `name`, the selection
    // survives it — a reload nobody asked for must not cost the user a batch they were
    // half way through building.
    store$.overrideSelector(selectSnapshots, fakeZfsSnapshotDataSource.map((snapshot) => ({ ...snapshot })));
    store$.refreshState();
    spectator.detectChanges();

    expect(await table.getSelectedRowCount()).toBe(1);
    expect(await table.isRowSelected(0)).toBe(true);
  });

  it('drops a selected snapshot the store no longer lists', async () => {
    const store$ = spectator.inject(MockStore);

    await table.toggleRowSelection(0);
    // Row 0 is `second-snapshot` — the list is sorted by name, descending.
    store$.overrideSelector(selectSnapshots, [fakeZfsSnapshotDataSource[0]]);
    store$.refreshState();
    spectator.detectChanges();

    // The table only ever sees one page, so it cannot know the row is gone; the component
    // prunes it before the batch toolbar can offer to delete it.
    expect(spectator.query('.batch-actions-toolbar')).toBeNull();
  });

  it('should open form when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(SnapshotAddFormComponent, {
      title: 'Add Snapshot',
    });
  });

  describe('opened for a dataset', () => {
    // The route names `test-dataset`. A child, a sibling whose name starts with the scope, and
    // another dataset whose snapshot name contains it: only the first two belong to the scope.
    const scopedSnapshots = [
      { name: 'test-dataset@own', dataset: 'test-dataset', snapshot_name: 'own' },
      { name: 'test-dataset/child@nested', dataset: 'test-dataset/child', snapshot_name: 'nested' },
      { name: 'test-dataset-2@sibling', dataset: 'test-dataset-2', snapshot_name: 'sibling' },
      { name: 'dozer/other@test-dataset-backup', dataset: 'dozer/other', snapshot_name: 'test-dataset-backup' },
    ] as ZfsSnapshot[];

    async function shownSnapshots(): Promise<string[]> {
      const rowCount = await table.getRowCount();
      const names: string[] = [];
      for (let row = 0; row < rowCount; row++) {
        names.push(await table.getCellText(row, 'snapshot_name'));
      }
      return names.sort((a, b) => a.localeCompare(b));
    }

    beforeEach(() => {
      setSnapshots(scopedSnapshots);
    });

    it('starts with an empty search box and titles the page with the dataset', () => {
      expect(spectator.query(BasicSearchComponent)?.query()).toBe('');
      expect(ngMocks.input('ix-page-header', 'pageTitle')).toBe('Snapshots: test-dataset');
    });

    it('shows the dataset and its children, not a sibling or a snapshot whose name holds the dataset', async () => {
      expect(await shownSnapshots()).toEqual(['nested', 'own']);
    });

    it('shows only the dataset itself once Include child datasets is off', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Include child datasets' }));
      expect(await toggle.isChecked()).toBe(true);

      await toggle.toggle();
      spectator.detectChanges();

      expect(await shownSnapshots()).toEqual(['own']);
    });

    it('applies the search within the dataset, never instead of it', async () => {
      spectator.triggerEventHandler('ix-basic-search', 'queryChange', 'nested');
      spectator.detectChanges();
      expect(await shownSnapshots()).toEqual(['nested']);

      // Only the other dataset's snapshot holds `backup`, and it is outside the scope.
      spectator.triggerEventHandler('ix-basic-search', 'queryChange', 'backup');
      spectator.detectChanges();
      expect(spectator.component.dataProvider.totalRows).toBe(0);
    });

    it('shows every snapshot, and drops the dataset from the URL, once the scope chip is cleared', async () => {
      const chip = await loader.getHarness(TnChipHarness.with({ label: 'test-dataset' }));
      await chip.close();
      spectator.detectChanges();

      expect(await shownSnapshots()).toEqual(['nested', 'own', 'sibling', 'test-dataset-backup']);
      expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/datasets/snapshots');
      expect(ngMocks.input('ix-page-header', 'pageTitle')).toBe('Snapshots');
      expect(await loader.getHarnessOrNull(TnChipHarness)).toBeNull();
    });
  });

  it('filters only by name when the extra columns are hidden', () => {
    const component = spectator.component;
    const setFilterSpy = jest.spyOn(component.dataProvider, 'setFilter');

    spectator.triggerEventHandler('ix-basic-search', 'queryChange', '1.49');

    expect(setFilterSpy).toHaveBeenCalledWith({
      list: fakeZfsSnapshotDataSource,
      query: '1.49',
      columnKeys: ['name'],
    }, { keepPage: false });
  });

  it('also filters by the extra columns (used/referenced/created) when they are visible', async () => {
    const component = spectator.component;
    const slideToggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Show extra columns' }));
    await slideToggle.toggle();
    spectator.component.loadingExtraColumns$.next(false);
    spectator.detectChanges();

    // A size value that only appears in the "Used"/"Referenced" columns keeps the
    // matching rows and drops nothing, proving the size columns are searched.
    spectator.triggerEventHandler('ix-basic-search', 'queryChange', '1.49 TiB');
    spectator.detectChanges();
    expect(await table.getRowCount()).toBe(2);

    // A size no snapshot uses filters everything out.
    spectator.triggerEventHandler('ix-basic-search', 'queryChange', '999 GiB');
    spectator.detectChanges();
    expect(component.dataProvider.totalRows).toBe(0);

    // The on-screen creation date is searchable too.
    spectator.triggerEventHandler('ix-basic-search', 'queryChange', '2021-10-18');
    spectator.detectChanges();
    expect(await table.getRowCount()).toBe(2);
  });
});

describe('SnapshotListComponent — paging', () => {
  // Enough snapshots for three pages at the default page size of 50.
  const manySnapshots: ZfsSnapshot[] = Array.from({ length: 120 }, (_, index) => ({
    id: String(index),
    name: `test-dataset@snap-${String(index).padStart(3, '0')}`,
    dataset: 'test-dataset',
    snapshot_name: `snap-${String(index).padStart(3, '0')}`,
  } as ZfsSnapshot));

  let spectator: Spectator<SnapshotListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let pager: TnTablePagerHarness;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      ReactiveFormsModule,
      MockComponent(IxDateComponent),
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockApi([mockQuery('pool.snapshot.query', manySnapshots as unknown as WebUiQueryEntity<'pool.snapshot.query'>[])]),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockProvider(FormSidePanelService, { open: jest.fn(() => SlideInResult.empty()) }),
      provideMockStore({
        selectors: [
          { selector: selectSnapshotState, value: snapshotsInitialState },
          { selector: selectSnapshots, value: manySnapshots },
          { selector: selectSnapshotsTotal, value: manySnapshots.length },
          { selector: selectPreferences, value: { showSnapshotExtraColumns: false } },
          { selector: selectGeneralConfig, value: { timezone: 'Europe/Kiev' } },
        ],
      }),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (): string | null => null } } },
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
    pager = await loader.getHarness(TnTablePagerHarness);
    await pager.nextPage();
    spectator.detectChanges();
  });

  it('stays on the page the user is reading when a row there is selected', async () => {
    const firstRow = await table.getCellText(0, 'snapshot_name');

    await table.toggleRowSelection(0);
    spectator.detectChanges();

    expect(await pager.getRangeText()).toBe('51 – 100 of 120');
    expect(await table.getCellText(0, 'snapshot_name')).toBe(firstRow);
    expect(await table.isRowSelected(0)).toBe(true);
  });

  it('stays on the page the user is reading when the store reloads underneath them', async () => {
    const store$ = spectator.inject(MockStore);
    const firstRow = await table.getCellText(0, 'snapshot_name');

    store$.overrideSelector(selectSnapshots, manySnapshots.map((snapshot) => ({ ...snapshot })));
    store$.refreshState();
    spectator.detectChanges();

    expect(await pager.getRangeText()).toBe('51 – 100 of 120');
    expect(await table.getCellText(0, 'snapshot_name')).toBe(firstRow);
  });

  it('clamps back into range when a reload shrinks the list below the current page', async () => {
    const store$ = spectator.inject(MockStore);
    const remaining = manySnapshots.slice(0, 30);

    // The 70 snapshots behind pages 2 and 3 are gone — a retention prune, or a batch delete
    // of the rows the user was reading. `keepPage` must not leave them on page 2 of one,
    // which the empty state would render as "No search results" with no pager to get back.
    store$.overrideSelector(selectSnapshots, remaining);
    store$.overrideSelector(selectSnapshotsTotal, remaining.length);
    store$.refreshState();
    spectator.detectChanges();

    expect(await pager.getRangeText()).toBe('1 – 30 of 30');
    expect(await table.getRowCount()).toBe(30);
  });

  it('drops a selection made on a page the user has left when the store stops listing it', async () => {
    const store$ = spectator.inject(MockStore);

    await table.toggleRowSelection(0);
    const offScreenPick = await table.getCellText(0, 'snapshot_name');
    await pager.goToFirstPage();
    spectator.detectChanges();
    expect(spectator.query('.batch-actions-toolbar')).not.toBeNull();

    // Nothing about the visible page-1 selection changes here, so the prune cannot depend on
    // tn-table emitting selectionChange for a row it never rendered.
    store$.overrideSelector(
      selectSnapshots,
      manySnapshots.filter((snapshot) => snapshot.snapshot_name !== offScreenPick),
    );
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.query('.batch-actions-toolbar')).toBeNull();
  });

  it('offers rows selected on more than one page to the batch toolbar', async () => {
    await table.toggleRowSelection(0);
    const secondPagePick = await table.getCellText(0, 'snapshot_name');

    await pager.goToFirstPage();
    spectator.detectChanges();
    await table.toggleRowSelection(0);
    const firstPagePick = await table.getCellText(0, 'snapshot_name');
    spectator.detectChanges();

    // The row picked on page 2 is still selected, and comes back checked when that page does.
    expect(spectator.query('.batch-actions-toolbar')).not.toBeNull();
    await pager.nextPage();
    spectator.detectChanges();
    expect(await table.isRowSelected(0)).toBe(true);
    expect(await table.getCellText(0, 'snapshot_name')).toBe(secondPagePick);
    expect(firstPagePick).not.toBe(secondPagePick);
  });
});

describe('SnapshotListComponent — paging on a dataset route', () => {
  // The route names `tank`, which holds no snapshots of its own, while a child holds enough for
  // three pages; they are in scope because Include child datasets starts on.
  const childSnapshots: ZfsSnapshot[] = Array.from({ length: 120 }, (_, index) => ({
    id: String(index),
    name: `tank/child@snap-${String(index).padStart(3, '0')}`,
    dataset: 'tank/child',
    snapshot_name: `snap-${String(index).padStart(3, '0')}`,
  } as ZfsSnapshot));

  let spectator: Spectator<SnapshotListComponent>;
  let loader: HarnessLoader;
  let pager: TnTablePagerHarness;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      ReactiveFormsModule,
      MockComponent(IxDateComponent),
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockApi([mockQuery('pool.snapshot.query', childSnapshots as unknown as WebUiQueryEntity<'pool.snapshot.query'>[])]),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockProvider(FormSidePanelService, { open: jest.fn(() => SlideInResult.empty()) }),
      provideMockStore({
        selectors: [
          { selector: selectSnapshotState, value: snapshotsInitialState },
          { selector: selectSnapshots, value: childSnapshots },
          { selector: selectSnapshotsTotal, value: childSnapshots.length },
          { selector: selectPreferences, value: { showSnapshotExtraColumns: false } },
          { selector: selectGeneralConfig, value: { timezone: 'Europe/Kiev' } },
        ],
      }),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (): string | null => 'tank' } } },
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    pager = await loader.getHarness(TnTablePagerHarness);
    await pager.nextPage();
    spectator.detectChanges();
  });

  it('holds the page through a reload when the scope lists only a child dataset\'s snapshots', async () => {
    const store$ = spectator.inject(MockStore);
    expect(await pager.getRangeText()).toBe('51 – 100 of 120');

    store$.overrideSelector(selectSnapshots, childSnapshots.map((snapshot) => ({ ...snapshot })));
    store$.refreshState();
    spectator.detectChanges();

    // A filter pass that narrowed to the route's own dataset would clamp the page against zero
    // rows and start over from page 1.
    expect(await pager.getRangeText()).toBe('51 – 100 of 120');
  });
});
