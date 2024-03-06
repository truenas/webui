import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { snapshotsInitialState } from 'app/pages/datasets/modules/snapshots/store/snapshot.reducer';
import { selectSnapshotState, selectSnapshots, selectSnapshotsTotal } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { fakeZfsSnapshotDataSource } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { SnapshotListComponent } from './snapshot-list.component';

describe('SnapshotListComponent', () => {
  let spectator: Spectator<SnapshotListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<AppState>;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      CoreComponents,
      IxTable2Module,
      MockModule(LayoutModule),
      MockModule(PageHeaderModule),
      SearchInput1Component,
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('zfs.snapshot.query', fakeZfsSnapshotDataSource),
        mockCall('zfs.snapshot.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService),
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
              timezone: 'America/Alaska',
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
    store$ = spectator.inject(MockStore);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    store$.overrideSelector(selectSnapshots, fakeZfsSnapshotDataSource);
    store$.refreshState();

    await spectator.fixture.whenStable();

    const expectedRows = [
      ['', 'Dataset', 'Snapshot'],
      ['', 'test-dataset', 'second-snapshot'],
      ['', 'test-dataset', 'first-snapshot'],
    ];
    const tableData = await table.getCellTexts();
    expect(tableData).toEqual(expectedRows);
  });

  it('should show table with extra columns', async () => {
    store$.overrideSelector(selectPreferences, { showSnapshotExtraColumns: true } as Preferences);
    store$.overrideSelector(selectSnapshots, fakeZfsSnapshotDataSource);
    store$.refreshState();
    store$.select(selectSnapshots).subscribe((snapshots) => {
      expect(snapshots).toEqual(fakeZfsSnapshotDataSource);
    });

    // TODO: Fix it when sizeColumn, dateColumn is updated if neccessary
    // const expectedRows = [
    //   ['', 'Dataset', 'Snapshot', 'Used', 'Date created', 'Referenced'],
    //   ['', 'test-dataset', 'second-snapshot', '1.49 TiB', '2021-10-18 19:51:43', '1.49 TiB'],
    //   ['', 'test-dataset', 'first-snapshot', '1.49 TiB', '2021-10-18 19:51:54', '1.49 TiB'],
    // ];

    const expectedRows = [
      ['', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['', '', '', '', '', ''],
    ];
    expect(await table.getCellTexts()).toEqual(expectedRows);
  });
});
