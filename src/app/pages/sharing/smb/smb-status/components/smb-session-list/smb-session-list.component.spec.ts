import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SmbSession } from 'app/interfaces/smb-status.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { SmbSessionListComponent } from './smb-session-list.component';

describe('SmbSessionListComponent', () => {
  let spectator: Spectator<SmbSessionListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const sessions = [
    {
      session_id: '3411433488',
      server_id: {
        pid: '1484266',
        task_id: '0',
        vnn: '4294967295',
        unique_id: '15357526038186397558',
      },
      uid: 3004,
      gid: 3004,
      username: 'admin',
      groupname: 'admin',
      remote_machine: '1.1.1.1',
      hostname: 'ipv4:1.1.1.1:65188',
      session_dialect: 'SMB3_11',
      encryption: {
        cipher: '-',
        degree: 'none',
      },
      signing: {
        cipher: 'AES-128-GMAC',
        degree: 'partial',
      },
    },
  ] as SmbSession[];

  const createComponent = createComponentFactory({
    component: SmbSessionListComponent,
    imports: [
      BasicSearchComponent,
    ],
    providers: [
      mockApi([mockCall('smb.status', sessions)]),
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
      'Session ID',
      'Hostname',
      'Remote machine',
      'Username',
      'Groupname',
      'UID',
      'GID',
      'Session dialect',
      'Encryption',
      'Signing',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      [
        '3411433488',
        'ipv4:1.1.1.1:65188',
        '1.1.1.1',
        'admin',
        'admin',
        '3004',
        '3004',
        'SMB3_11',
        '-',
        'AES-128-GMAC',
      ],
    ]);
  });

  it('should call loadData when Refresh button is pressed', () => {
    jest.spyOn(spectator.component.dataProvider, 'load');
    spectator.component.loadData();
    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });
});
