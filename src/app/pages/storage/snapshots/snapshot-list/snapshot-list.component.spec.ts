import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { MockPipe } from 'ng-mocks';
import { FileSizePipe } from 'ngx-filesize';
import { of, Subject } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { SnapshotEffects } from 'app/pages/storage/snapshots/store/snapshot.effects';
import { adapter, snapshotReducer } from 'app/pages/storage/snapshots/store/snapshot.reducer';
import { fakeZfsSnapshotDataSource } from 'app/pages/storage/snapshots/testing/snapshot-fake-datasource';
import { DialogService, ModalService } from 'app/services';
import { preferencesReducer, PreferencesState } from 'app/store/preferences/preferences.reducer';
import { preferencesStateKey } from 'app/store/preferences/preferences.selectors';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';
import { snapshotsNotLoaded, snapshotExtraColumnsPreferenceLoaded } from '../store/snapshot.actions';
import { snapshotsInitialState } from '../store/snapshot.reducer';
import { snapshotStateKey } from '../store/snapshot.selectors';
import { SnapshotListComponent } from './snapshot-list.component';

describe('SnapshotListComponent', () => {
  let spectator: Spectator<SnapshotListComponent>;
  let loader: HarnessLoader;
  let websocket: MockWebsocketService;

  const createComponent = createComponentFactory({
    component: SnapshotListComponent,
    imports: [
      CoreComponents,
      EntityModule,
      IxTableModule,
      StoreModule.forRoot({
        [snapshotStateKey]: snapshotReducer,
        [systemConfigStateKey]: systemConfigReducer,
        [preferencesStateKey]: preferencesReducer,
      }, {
        initialState: {
          [snapshotStateKey]: adapter.setAll([...fakeZfsSnapshotDataSource], snapshotsInitialState),
          [systemConfigStateKey]: {
            generalConfig: {
              timezone: 'America/Alaska',
            },
          } as SystemConfigState,
          [preferencesStateKey]: {
            areLoaded: true,
            preferences: {
              showSnapshotExtraColumns: false,
              tableDisplayedColumns: [],
            } as Preferences,
          } as PreferencesState,
        },
      }),
      EffectsModule.forRoot([SnapshotEffects]),
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2021-11-05 10:52:06')),
      MockPipe(FileSizePipe, jest.fn(() => '1.49 TiB')),
    ],
    providers: [
      mockWebsocket([
        mockCall('zfs.snapshot.query', []),
        mockCall('zfs.snapshot.clone'),
        mockCall('zfs.snapshot.rollback'),
        mockCall('zfs.snapshot.delete'),
        mockCall('zfs.snapshot.create'),
      ]),
      mockProvider(DialogService),
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => of(true)),
        onClose$: new Subject<unknown>(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(MockWebsocketService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show table rows', async () => {
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query', fakeZfsSnapshotDataSource);
    spectator.inject(Store).dispatch(snapshotExtraColumnsPreferenceLoaded({ extra: false }));

    const table = await loader.getHarness(IxTableHarness);

    const expectedHeaderRow = ['', 'Dataset', 'Snapshot', ''];
    const headerRows = await table.getHeaderRows();
    const headerRow = await headerRows[0].getCellTextByIndex();
    expect(headerRow).toEqual(expectedHeaderRow);

    // sorted by snapshot.name
    const expectedRows = [
      ['', 'test-dataset', 'second-snapshot', 'more_vert'],
      ['', 'test-dataset', 'first-snapshot', 'more_vert'],
    ];
    const cells = await table.getCellsWithoutExpandedRows();
    expect(cells).toEqual(expectedRows);

    expect(websocket.call).toHaveBeenCalledWith('zfs.snapshot.query', [
      [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { select: ['name', 'snapshot_name', 'dataset'], order_by: ['name'] },
    ]);
  });

  it('should show table with extra rows', async () => {
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query', fakeZfsSnapshotDataSource);
    spectator.inject(Store).dispatch(snapshotExtraColumnsPreferenceLoaded({ extra: true }));

    const table = await loader.getHarness(IxTableHarness);

    const expectedHeaderRow = ['', 'Dataset', 'Snapshot', 'Used', 'Date created', 'Referenced', ''];
    const headerRows = await table.getHeaderRows();
    const headerRow = await headerRows[0].getCellTextByIndex();
    expect(headerRow).toEqual(expectedHeaderRow);

    const rows = await table.getCells();
    const expectedRows = [
      ['', 'test-dataset', 'second-snapshot', '1.49 TiB', '2021-11-05 10:52:06', '1.49 TiB', 'more_vert'],
      ['', 'test-dataset', 'first-snapshot', '1.49 TiB', '2021-11-05 10:52:06', '1.49 TiB', 'more_vert'],
    ];
    expect(rows).toEqual(expectedRows);

    expect(websocket.call).toHaveBeenCalledWith('zfs.snapshot.query', [
      [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { select: ['name', 'snapshot_name', 'dataset', 'properties'], order_by: ['name'] },
    ]);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query', []);
    spectator.inject(Store).dispatch(snapshotExtraColumnsPreferenceLoaded({ extra: false }));

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No snapshots are available.']]);
  });

  it('should have error message when can not retrieve response', async () => {
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query');
    spectator.inject(Store).dispatch(snapshotsNotLoaded({ error: 'Snapshots could not be loaded' }));

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Snapshots could not be loaded']]);
  });

  it('should expand row on click', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const [firstRow] = await table.getRows();

    const element = await firstRow.host();
    await element.click();

    expect(element.hasClass('expanded-row')).toBeTruthy();
  });
});
