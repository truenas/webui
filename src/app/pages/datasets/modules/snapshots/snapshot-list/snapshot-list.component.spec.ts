import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
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
        mockCall('pool.snapshot.query', fakeZfsSnapshotDataSource),
        mockCall('pool.snapshot.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
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

  it('clears the current selection when the snapshot list reloads', async () => {
    const store$ = spectator.inject(MockStore);

    await table.toggleRowSelection(0);
    expect(await table.getSelectedRowCount()).toBe(1);

    // A store re-emission hands back fresh row objects; the prior selection now
    // points at stale references that no longer map to visible rows, so it is cleared.
    store$.overrideSelector(selectSnapshots, [...fakeZfsSnapshotDataSource]);
    store$.refreshState();
    spectator.detectChanges();

    expect(await table.getSelectedRowCount()).toBe(0);
  });

  it('should open form when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(SnapshotAddFormComponent, {
      title: 'Add Snapshot',
    });
  });

  it('should filter snapshots by dataset when route parameter is present', () => {
    const component = spectator.component;

    const testSnapshots = [
      {
        id: '1',
        name: '/dozer/test-dataset@snapshot1',
        dataset: '/dozer/test-dataset',
        snapshot_name: 'snapshot1',
      } as ZfsSnapshot,
      {
        id: '2',
        name: '/dozer/test2@snapshot2',
        dataset: '/dozer/test2',
        snapshot_name: 'snapshot2',
      } as ZfsSnapshot,
      {
        id: '3',
        name: '/dozer/test3@snapshot3',
        dataset: '/dozer/test3',
        snapshot_name: 'snapshot3',
      } as ZfsSnapshot,
    ];

    component.snapshots = testSnapshots;

    const setFilterSpy = jest.spyOn(component.dataProvider, 'setFilter');

    spectator.triggerEventHandler('ix-basic-search', 'queryChange', 'test-dataset');

    expect(component.searchQuery()).toBe('test-dataset');

    expect(setFilterSpy).toHaveBeenCalledWith({
      list: component.snapshots,
      query: 'test-dataset',
      columnKeys: ['dataset'],
      exact: true,
    });
  });

  it('should fallback to name-based filtering when dataset exact match fails', () => {
    const component = spectator.component;

    const testSnapshots = [
      {
        id: '1',
        name: '/dozer/different-dataset@snapshot1',
        dataset: '/dozer/different-dataset',
        snapshot_name: 'snapshot1',
      } as ZfsSnapshot,
      {
        id: '2',
        name: '/dozer/another-dataset@test-dataset-backup',
        dataset: '/dozer/another-dataset',
        snapshot_name: 'test-dataset-backup',
      } as ZfsSnapshot,
    ];

    component.snapshots = testSnapshots;

    const setFilterSpy = jest.spyOn(component.dataProvider, 'setFilter');

    spectator.triggerEventHandler('ix-basic-search', 'queryChange', 'test-dataset');

    expect(setFilterSpy).toHaveBeenCalledTimes(2);
    expect(setFilterSpy).toHaveBeenNthCalledWith(1, {
      list: component.snapshots,
      query: 'test-dataset',
      columnKeys: ['dataset'],
      exact: true,
    });
    expect(setFilterSpy).toHaveBeenNthCalledWith(2, {
      list: component.snapshots,
      query: 'test-dataset',
      columnKeys: ['name'],
    });
  });

  it('should not show partial matches when using exact dataset filtering', () => {
    const component = spectator.component;

    // eslint-disable-next-line @typescript-eslint/dot-notation
    jest.spyOn(component['route'].snapshot.paramMap, 'get').mockReturnValue('dozer/boom');

    const testSnapshots = [
      {
        id: '1',
        name: 'dozer/boom@snapshot1',
        dataset: 'dozer/boom',
        snapshot_name: 'snapshot1',
      } as ZfsSnapshot,
      {
        id: '2',
        name: 'dozer/boom1@snapshot2',
        dataset: 'dozer/boom1',
        snapshot_name: 'snapshot2',
      } as ZfsSnapshot,
      {
        id: '3',
        name: 'dozer/boom2@snapshot3',
        dataset: 'dozer/boom2',
        snapshot_name: 'snapshot3',
      } as ZfsSnapshot,
    ];

    component.snapshots = testSnapshots;

    const setFilterSpy = jest.spyOn(component.dataProvider, 'setFilter');

    spectator.triggerEventHandler('ix-basic-search', 'queryChange', 'dozer/boom');

    expect(setFilterSpy).toHaveBeenCalledTimes(1);
    expect(setFilterSpy).toHaveBeenCalledWith({
      list: component.snapshots,
      query: 'dozer/boom',
      columnKeys: ['dataset'],
      exact: true,
    });
  });
});
