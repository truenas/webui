import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Nfs3Session, Nfs4Session, NfsType } from 'app/interfaces/nfs-share.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { NfsSessionListComponent } from './nfs-session-list.component';

describe('NfsSessionListComponent', () => {
  let spectator: Spectator<NfsSessionListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const nfs3Sessions = [{ ip: '10.238.238.162', export: '10.238.238.162:/mnt/tank/nfs' }] as Nfs3Session[];

  const nfs4Sessions = [
    {
      id: 4,
      info: {
        clientid: 6273260596088110000,
        address: '192.168.40.247:790',
        status: 'confirmed',
        name: 'Linux NFSv4.2 debian12-hv',
        'seconds from last renew': 45,
        'minor version': 2,
        'Implementation domain': 'kernel.org',
        'Implementation name': 'Linux 6.1.0-12-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.52-1 (2023-09-07) x86_64',
        'Implementation time': [
          0,
          0,
        ],
        'callback state': 'UP',
        'callback address': '192.168.40.247:0',
      },
      states: [],
    },
  ] as Nfs4Session[];

  const createComponent = createComponentFactory({
    component: NfsSessionListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockApi([
        mockCall('nfs.get_nfs3_clients', nfs3Sessions),
        mockCall('nfs.get_nfs4_clients', nfs4Sessions),
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

  describe('NFS 3', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('should show NFS 3 table rows', async () => {
      expect(await table.getHeaderTexts()).toEqual(['IP', 'Export']);
      expect(await table.getAllRowTexts()).toEqual([
        ['10.238.238.162', '10.238.238.162:/mnt/tank/nfs'],
      ]);
    });
  });

  describe('NFS 4', () => {
    beforeEach(async () => {
      spectator = createComponent();
      spectator.component.nfsTypeChanged(NfsType.Nfs4);
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('shows NFS 4 table once is switched', async () => {
      expect(await table.getHeaderTexts()).toEqual([
        'Name',
        'Client ID',
        'Address',
        'Status',
        'Seconds From Last Renew',
      ]);
      expect(await table.getAllRowTexts()).toEqual([
        [
          'Linux NFSv4.2 debian12-hv',
          '6273260596088110000',
          '192.168.40.247:790',
          'Confirmed',
          '45',
        ],
      ]);
    });
  });
});
