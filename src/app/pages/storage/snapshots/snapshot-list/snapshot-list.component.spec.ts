import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { MockPipe } from 'ng-mocks';
import { FileSizePipe } from 'ngx-filesize';
import { of, Subject } from 'rxjs';
import { CoreComponents } from 'app/core/components/core-components.module';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { SnapshotDetailsComponent } from 'app/pages/storage/snapshots/snapshot-details/snapshot-details.component';
import { snapshotPageEntered } from 'app/pages/storage/snapshots/store/snapshot.actions';
import { SnapshotEffects } from 'app/pages/storage/snapshots/store/snapshot.effects';
import { adapter, snapshotReducer } from 'app/pages/storage/snapshots/store/snapshot.reducer';
import { DialogService, ModalService } from 'app/services';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';
import { snapshotsNotLoaded } from '../store/snapshot.actions';
import { snapshotsInitialState } from '../store/snapshot.reducer';
import { snapshotStateKey } from '../store/snapshot.selectors';
import { SnapshotListComponent } from './snapshot-list.component';

export const fakeDataSource: ZfsSnapshot[] = [{
  name: 'test-dataset@snapshot-first',
  properties: {
    creation: {
      parsed: {
        $date: 1634575914000,
      },
    },
    used: {
      parsed: 1634575914000,
    },
    referenced: {
      parsed: 1634575914000,
    },
  },
}, {
  name: 'test-dataset@snapshot-second',
  properties: {
    creation: {
      parsed: {
        $date: 1634575903000,
      },
    },
    used: {
      parsed: 1634575903000,
    },
    referenced: {
      parsed: 1634575903000,
    },
  },
}] as unknown as ZfsSnapshot[];

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
      }, {
        initialState: {
          [snapshotStateKey]: adapter.setAll([...fakeDataSource], snapshotsInitialState),
          [systemConfigStateKey]: {
            generalConfig: {
              timezone: 'America/Alaska',
            },
          } as SystemConfigState,
        },
      }),
      EffectsModule.forRoot([SnapshotEffects]),
    ],
    declarations: [
      SnapshotDetailsComponent,
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
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query', fakeDataSource);
    spectator.inject(Store).dispatch(snapshotPageEntered({ extra: false }));

    const table = await loader.getHarness(IxTableHarness);

    const expectedHeaderRow = ['', 'Dataset', 'Snapshot', ''];
    const headerRows = await table.getHeaderRows();
    const headerRow = await headerRows[0].getCellTextByIndex();
    expect(headerRow).toEqual(expectedHeaderRow);

    // sorted by snapshot.name
    const expectedRows = [
      ['', 'test-dataset', 'snapshot-second', 'expand_more'],
      ['', 'test-dataset', 'snapshot-first', 'expand_more'],
    ];
    const cells = await table.getCellsWithoutExpandedRows();
    expect(cells).toEqual(expectedRows);

    expect(websocket.call).toHaveBeenCalledWith('zfs.snapshot.query', [
      [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { order_by: ['name'], select: ['name'] },
    ]);
  });

  it('should show table with extra rows', async () => {
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query', fakeDataSource);
    spectator.inject(Store).dispatch(snapshotPageEntered({ extra: true }));
    spectator.fixture.componentInstance.showExtraColumns$.next(true);

    const table = await loader.getHarness(IxTableHarness);

    const expectedHeaderRow = ['', 'Dataset', 'Snapshot', 'Used', 'Date created', 'Referenced', ''];
    const headerRows = await table.getHeaderRows();
    const headerRow = await headerRows[0].getCellTextByIndex();
    expect(headerRow).toEqual(expectedHeaderRow);

    const rows = await table.getCells();
    const expectedRows = [
      ['', 'test-dataset', 'snapshot-second', '1.49 TiB', '2021-11-05 10:52:06', '1.49 TiB', 'more_vert'],
      ['', 'test-dataset', 'snapshot-first', '1.49 TiB', '2021-11-05 10:52:06', '1.49 TiB', 'more_vert'],
    ];
    expect(rows).toEqual(expectedRows);

    expect(websocket.call).toHaveBeenCalledWith('zfs.snapshot.query', [
      [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { order_by: ['name'], select: ['name', 'properties'] },
    ]);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    spectator.inject(MockWebsocketService).mockCallOnce('zfs.snapshot.query', []);
    spectator.inject(Store).dispatch(snapshotPageEntered({ extra: false }));

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
