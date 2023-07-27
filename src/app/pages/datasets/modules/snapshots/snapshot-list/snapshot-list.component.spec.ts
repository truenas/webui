import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockPipe } from 'ng-mocks';
import { FileSizePipe } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { snapshotsInitialState, SnapshotsState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import {
  selectSnapshots, selectSnapshotState, selectSnapshotsTotal,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { fakeZfsSnapshotDataSource } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { DialogService } from 'app/services/dialog.service';
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
      FakeFormatDateTimePipe,
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

  it('should have error message when can not retrieve response', async () => {
    store$.overrideSelector(selectSnapshotState, {
      error: 'Snapshots could not be loaded',
    } as SnapshotsState);
    store$.refreshState();
    store$.select(selectSnapshots).subscribe((snapshots) => {
      expect(snapshots).toEqual([]);
    });

    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('Can not retrieve response');
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('No records have been added yet');
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
      ['', 'test-dataset', 'second-snapshot', ''],
      ['', 'test-dataset', 'first-snapshot', ''],
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
      ['', 'test-dataset', 'second-snapshot', '1.49 TiB', '2021-10-18 19:51:43', '1.49 TiB', ''],
      ['', 'test-dataset', 'first-snapshot', '1.49 TiB', '2021-10-18 19:51:54', '1.49 TiB', ''],
    ];
    expect(tableData).toEqual(expectedRows);
  });
});
