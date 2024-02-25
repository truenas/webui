import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { fakeBootEnvironmentsDataSource } from 'app/pages/system/bootenv/test/fake-boot-environments';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('BootEnvironmentListComponent', () => {
  let spectator: Spectator<BootEnvironmentListComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService;

  const createComponent = createComponentFactory({
    component: BootEnvironmentListComponent,
    imports: [
      IxTableModule,
      AppLoaderModule,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockWebSocket([
        mockCall('bootenv.query', fakeBootEnvironmentsDataSource),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatSnackBar),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(),
      }),
      mockProvider(IxFormatterService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
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
      ['', 'CLONE', '', '2022-08-22 19:27:00', '384 KiB', 'No', ''],
      [
        '',
        '22.12-MASTER-20220808-020013',
        'Now/Reboot',
        '2022-08-09 16:52:00',
        '2.61 GiB',
        'No',
        '',
      ],
    ];

    expect(websocket.call).toHaveBeenCalledWith('bootenv.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should show empty message when loaded and datasource is empty', async () => {
    spectator.inject(MockWebSocketService).mockCall('bootenv.query', []);
    spectator.component.ngOnInit();

    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('No records have been added yet');
  });

  it('should show error message when can not retrieve response', async () => {
    spectator.inject(MockWebSocketService).mockCall('bootenv.query', []);
    spectator.component.ngOnInit();
    spectator.component.isError$.next(true);

    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('Can not retrieve response');
  });
});
