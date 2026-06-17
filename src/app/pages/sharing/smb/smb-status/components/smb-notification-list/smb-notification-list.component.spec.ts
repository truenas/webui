import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SmbNotificationInfo } from 'app/interfaces/smb-status.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { SmbNotificationListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-notification-list/smb-notification-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('SmbNotificationListComponent', () => {
  let spectator: Spectator<SmbNotificationListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
      BasicSearchComponent,
    ],
    providers: [
      mockApi([mockCall('smb.status', notifications)]),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Path', 'Filter', 'Subdir Filter', 'Creation Time']);
    expect(await table.getAllRowTexts()).toEqual([
      ['/mnt/APPS/turtles', '3399', '0', '1970-01-11T00:24:00.406311-23:00'],
    ]);
  });

  it('should call loadData when Refresh button is pressed', () => {
    jest.spyOn(spectator.component.dataProvider, 'load');
    spectator.component.loadData();
    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
