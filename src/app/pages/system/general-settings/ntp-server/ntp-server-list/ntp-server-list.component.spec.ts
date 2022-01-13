import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { NtpServerListComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-list/ntp-server-list.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const fakeDataSource: NtpServer[] = [
  {
    id: 2,
    address: '2.debian.pool.ntp.org',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  },
  {
    id: 3,
    address: '1.debian.pool.ntp.org',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  },
  {
    id: 10,
    address: '0.debian.pool.ntp.org',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  },
];

describe('NtpServerListComponent', () => {
  let spectator: Spectator<NtpServerListComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let slideIn: IxSlideInService;

  const createComponent = createComponentFactory({
    component: NtpServerListComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('system.ntpserver.query', fakeDataSource),
        mockCall('system.ntpserver.delete', true),
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
    ws = spectator.inject(WebSocketService);
    slideIn = spectator.inject(IxSlideInService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show table headers', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const headerRow = await table.getHeaderRow();

    expect(headerRow).toMatchObject({
      address: 'Address',
      burst: 'Burst',
      iburst: 'IBurst',
      prefer: 'Prefer',
      minpoll: 'Min Poll',
      maxpoll: 'Max Poll',
      actions: '',
    });
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);

    const expectedRows = [
      ['Address', 'Burst', 'IBurst', 'Prefer', 'Min Poll', 'Max Poll', ''],
      ['2.debian.pool.ntp.org', 'false', 'true', 'false', '6', '10', 'delete'],
      ['1.debian.pool.ntp.org', 'false', 'true', 'false', '6', '10', 'delete'],
      ['0.debian.pool.ntp.org', 'false', 'true', 'false', '6', '10', 'delete'],
    ];

    expect(ws.call).toHaveBeenCalledWith('system.ntpserver.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should show empty message when loaded and datasource is empty', async () => {
    spectator.fixture.componentInstance.loading = false;
    spectator.fixture.componentInstance.error = false;
    spectator.fixture.componentInstance.createDataSource();
    spectator.detectComponentChanges();

    const table = await loader.getHarness<IxTableHarness>(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No servers have been added yet']]);
  });

  it('should show error message when can not retrieve response', async () => {
    spectator.fixture.componentInstance.loading = false;
    spectator.fixture.componentInstance.error = true;
    spectator.fixture.componentInstance.createDataSource();
    spectator.detectComponentChanges();

    const table = await loader.getHarness<IxTableHarness>(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Can not retrieve response']]);
  });

  it('should open add ntp server form', async () => {
    jest.spyOn(slideIn, 'open').mockImplementation();
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(slideIn.open).toHaveBeenCalledWith(NtpServerFormComponent);
  });

  it('should open edit ntp server form', () => {
    jest.spyOn(slideIn, 'open').mockImplementation();
    spectator.click(spectator.query('.mat-column-address', { root: true }));

    expect(slideIn.open).toHaveBeenCalledWith(NtpServerFormComponent);
  });

  it('should display confirm dialog of deleting ntp server', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.ntpserver.delete', [2]);
  });
});
