import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { SmbNotificationInfo } from 'app/interfaces/smb-status.interface';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { SmbNotificationListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-notification-list/smb-notification-list.component';

describe('SmbNotificationListComponent', () => {
  let spectator: Spectator<SmbNotificationListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const notifications = [{
    server_id: {
      pid: '2102401',
      task_id: '0',
      vnn: '4294967295',
      unique_id: '4458796888113407749',
    },
    path: '/mnt/APPS/turtles',
    filter: '3399',
    subdir_filter: '0',
    creation_time: '1970-01-11T00:24:00.406311-23:00',
  }] as SmbNotificationInfo[];

  const createComponent = createComponentFactory({
    component: SmbNotificationListComponent,
    imports: [AppLoaderModule, IxTable2Module, SearchInput1Component],
    providers: [mockWebSocket([mockCall('smb.status', notifications)])],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Path', 'Filter', 'Subdir Filter', 'Creation Time'],
      ['/mnt/APPS/turtles', '3399', '0', '1970-01-11T00:24:00.406311-23:00'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('should call loadData when Refresh button is pressed', async () => {
    jest.spyOn(spectator.component.dataProvider, 'load');
    const refreshButton = await loader.getHarness(MatButtonHarness.with({ text: 'Refresh' }));
    await refreshButton.click();
    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
