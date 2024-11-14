import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SmbNotificationInfo } from 'app/interfaces/smb-status.interface';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { SmbNotificationListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-notification-list/smb-notification-list.component';

describe('SmbNotificationListComponent', () => {
  let spectator: Spectator<SmbNotificationListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
    ],
    providers: [mockApi([mockCall('smb.status', notifications)])],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
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
