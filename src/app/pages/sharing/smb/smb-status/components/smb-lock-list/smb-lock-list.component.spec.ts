import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { SmbLockListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-lock-list/smb-lock-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('SmbLockListComponent', () => {
  let spectator: Spectator<SmbLockListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const locks = [
    {
      service_path: '/mnt/APPS/turtles',
      filename: '.',
      fileid: { devid: 70, inode: 3, extid: 0 },
      num_pending_deletes: 0,
      opens: {
        '2102401/69': {
          server_id: {
            pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749',
          },
          uid: 3004,
          username: 'michelangelo',
          opened_at: '2023-10-26T12:17:27.190608+02:00',
        } as SmbOpenInfo,
        '2102401/70': {
          server_id: {
            pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749',
          },
          uid: 3005,
          username: 'donatello',
          opened_at: '2023-10-26T12:18:27.190608+02:00',
        } as SmbOpenInfo,
        '2102401/71': {
          server_id: {
            pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749',
          },
          uid: 3006,
          username: 'raphael',
          opened_at: '2023-10-26T10:10:10.190608+02:00',
        } as SmbOpenInfo,
        '2102401/72': {
          server_id: {
            pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749',
          },
          uid: 3007,
          username: 'leonardo',
          opened_at: '2023-10-26T10:10:10.190608+02:00',
        } as SmbOpenInfo,
      },
    },
  ] as SmbLockInfo[];

  const createComponent = createComponentFactory({
    component: SmbLockListComponent,
    imports: [
      BasicSearchComponent,
    ],
    providers: [
      mockApi([
        mockCall('smb.status', locks),
      ]),
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
    expect(await table.getHeaderTexts()).toEqual([
      'Path',
      'Filename',
      'File ID',
      'Open Files',
      'Num Pending Deletes',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      [
        '/mnt/APPS/turtles',
        '.',
        '70:3:0',
        '4 open files',
        '0',
      ],
    ]);
  });

  it('should call loadData when Refresh button is pressed', async () => {
    jest.spyOn(spectator.component.dataProvider, 'load');
    const refreshButton = await loader.getHarness(TnButtonHarness.with({ label: 'Refresh' }));
    await refreshButton.click();
    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
