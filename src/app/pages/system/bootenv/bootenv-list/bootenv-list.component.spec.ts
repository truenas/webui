import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  Spectator,
  createComponentFactory,
  mockProvider,
} from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import {
  mockWebsocket,
  mockCall,
} from 'app/core/testing/utils/mock-websocket.utils';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

export const fakeBootEnvironmentsDataSource = [
  {
    id: 'CLONE',
    realname: 'CLONE',
    name: 'CLONE',
    active: '',
    activated: false,
    can_activate: true,
    mountpoint: '-',
    space: '384.0K',
    created: {
      $date: 1661185620000,
    },
    keep: false,
    rawspace: 393216,
  },
  {
    id: '22.12-MASTER-20220808-020013',
    realname: '22.12-MASTER-20220808-020013',
    name: '22.12-MASTER-20220808-020013',
    active: 'NR',
    activated: true,
    can_activate: true,
    mountpoint: 'legacy',
    space: '2.61G',
    created: {
      $date: 1660053120000,
    },
    keep: false,
    rawspace: 2797170688,
  },
] as Bootenv[];

describe('BootEnvironmentListComponent', () => {
  let spectator: Spectator<BootEnvironmentListComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService;

  const createComponent = createComponentFactory({
    component: BootEnvironmentListComponent,
    imports: [EntityModule, IxTableModule, AppLoaderModule],
    declarations: [
      MockPipe(
        FormatDateTimePipe,
        jest.fn(() => '2022-08-09 20:52:00'),
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('bootenv.query', fakeBootEnvironmentsDataSource),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show table headers', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const headerRow = await table.getHeaderRow();

    expect(headerRow).toMatchObject({
      name: 'Name',
      active: 'Active',
      created: 'Date Created',
      rawspace: 'Space',
      keep: 'Keep',
      actions: '',
    });
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);

    const expectedRows = [
      ['', 'Name', 'Active', 'Date Created', 'Space', 'Keep', ''],
      ['', 'CLONE', '', '2022-08-09 20:52:00', '384 KiB', 'No', 'more_vert'],
      [
        '',
        '22.12-MASTER-20220808-020013',
        'Now/Reboot',
        '2022-08-09 20:52:00',
        '3 GiB',
        'No',
        'more_vert',
      ],
    ];

    expect(websocket.call).toHaveBeenCalledWith('bootenv.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should show empty message when loaded and datasource is empty', async () => {
    spectator.inject(MockWebsocketService).mockCall('bootenv.query', []);
    spectator.component.ngOnInit();

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No Boot Environments are available']]);
  });

  it('should show error message when can not retrieve response', async () => {
    spectator.inject(MockWebsocketService).mockCall('bootenv.query', []);
    spectator.component.ngOnInit();
    spectator.component.isError$.next(true);

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Boot Environments could not be loaded']]);
  });
});
