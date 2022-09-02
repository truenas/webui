import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockPipe } from 'ng-mocks';
import { FileSizePipe } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { snapshotsInitialState, SnapshotsState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import {
  selectSnapshots, selectSnapshotState, selectSnapshotsTotal,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { fakeZfsSnapshotDataSource } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { SnapshotListComponent } from './snapshot-list.component';

describe('SnapshotListComponent', () => {
  let spectator: Spectator<SnapshotListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<AppState>;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      CoreComponents,
      EntityModule,
      IxTableModule,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2021-11-05 10:52:06')),
      MockPipe(FileSizePipe, jest.fn(() => '1.49 TiB')),
    ],
    providers: [
      mockWebsocket([
        mockCall('zfs.snapshot.query', []),
        mockCall('zfs.snapshot.delete'),
      ]),
      mockProvider(DialogService),
      mockProvider(IxSlideInService),
      provideMockStore({
        selectors: [
          {
            selector: selectSnapshotState,
            value: snapshotsInitialState,
          },
          {
            selector: selectSnapshots,
            value: [],
          },
          {
            selector: selectSnapshotsTotal,
            value: 0,
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
              timezone: 'America/Alaska',
            },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
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
    store$ = spectator.inject(MockStore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should have error message when can not retrieve response', async () => {
    store$.overrideSelector(selectSnapshotState, {
      error: 'Snapshots could not be loaded',
    } as SnapshotsState);
    store$.refreshState();
    store$.select(selectSnapshots).subscribe((snapshots) => {
      expect(snapshots).toEqual([]);
    });

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Snapshots could not be loaded']]);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No snapshots are available.']]);
  });

  it('should show table rows', async () => {
    store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: false } as Preferences);
    store$.overrideSelector(selectSnapshots, fakeZfsSnapshotDataSource);
    store$.refreshState();

    store$.select(selectSnapshots).subscribe((snapshots) => {
      expect(snapshots).toEqual(fakeZfsSnapshotDataSource);
    });

    const table = await loader.getHarness(IxTableHarness);
    const expectedRows = [
      ['', 'Dataset', 'Snapshot', ''],
      ['', 'test-dataset', 'second-snapshot', 'expand_more'],
      ['', 'test-dataset', 'first-snapshot', 'expand_more'],
    ];
    const tableData = await table.getCells(true);
    expect(tableData).toEqual(expectedRows);
  });

  it('should show table with extra rows', async () => {
    store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: true } as Preferences);
    store$.overrideSelector(selectSnapshots, fakeZfsSnapshotDataSource);
    store$.refreshState();

    store$.select(selectSnapshots).subscribe((snapshots) => {
      expect(snapshots).toEqual(fakeZfsSnapshotDataSource);
    });

    const table = await loader.getHarness(IxTableHarness);
    const tableData = await table.getCells(true);
    const expectedRows = [
      ['', 'Dataset', 'Snapshot', 'Used', 'Date created', 'Referenced', ''],
      ['', 'test-dataset', 'second-snapshot', '1.49 TiB', '2021-11-05 10:52:06', '1.49 TiB', 'expand_more'],
      ['', 'test-dataset', 'first-snapshot', '1.49 TiB', '2021-11-05 10:52:06', '1.49 TiB', 'expand_more'],
    ];
    expect(tableData).toEqual(expectedRows);
  });
});
