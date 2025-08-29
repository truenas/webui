import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideToggleHarness } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      ReactiveFormsModule,
      IxTableDetailsRowDirective,
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
      mockProvider(SlideIn, {
        open: jest.fn(),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['', 'Dataset', 'Snapshot'],
      ['', 'test-dataset', 'second-snapshot'],
      ['', 'test-dataset', 'first-snapshot'],
    ];
    const tableData = await table.getCellTexts();
    expect(tableData).toEqual(expectedRows);
  });

  it('should show table with extra columns', async () => {
    const slideToggle = await loader.getHarness(IxSlideToggleHarness.with({ label: 'Show extra columns' }));
    await slideToggle.toggle();

    const expectedRows = [
      ['', 'Dataset', 'Snapshot', 'Used', 'Date created', 'Referenced'],
      ['', 'test-dataset', 'second-snapshot', '1.49 TiB', '2021-10-18 19:51:43', '1.49 TiB'],
      ['', 'test-dataset', 'first-snapshot', '1.49 TiB', '2021-10-18 19:51:54', '1.49 TiB'],
    ];
    expect(await table.getCellTexts()).toEqual(expectedRows);
  });

  it('should show form when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SnapshotAddFormComponent);
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

    component.snapshots = testSnapshots.map((snapshot) => ({ ...snapshot, selected: false }));

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

    component.snapshots = testSnapshots.map((snapshot) => ({ ...snapshot, selected: false }));

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

    component.snapshots = testSnapshots.map((snapshot) => ({ ...snapshot, selected: false }));

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
