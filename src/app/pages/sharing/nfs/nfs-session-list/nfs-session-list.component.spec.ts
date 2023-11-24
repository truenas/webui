import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Nfs3Session, Nfs4Session, NfsType } from 'app/interfaces/nfs-share.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { NfsSessionListComponent } from './nfs-session-list.component';

describe('NfsSessionListComponent', () => {
  let spectator: Spectator<NfsSessionListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const nfs3Sessions = [{ ip: '10.238.238.162', export: '10.238.238.162:/mnt/tank/nfs' }] as Nfs3Session[];

  const nfs4Sessions = [
    {
      id: '4',
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
  ] as unknown as Nfs4Session[];

  const createComponent = createComponentFactory({
    component: NfsSessionListComponent,
    imports: [AppLoaderModule, EntityModule, IxTable2Module],
    providers: [
      mockWebsocket([
        mockCall('nfs.get_nfs3_clients', nfs3Sessions),
        mockCall('nfs.get_nfs4_clients', nfs4Sessions),
      ]),
    ],
  });

  describe('NFS 3', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          activeNfsType: NfsType.Nfs3,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTable2Harness);
    });

    it('should show NFS 3 table rows', async () => {
      const expectedRows = [
        [
          'IP',
          'Export',
        ],
        [
          '10.238.238.162',
          '10.238.238.162:/mnt/tank/nfs',
        ],
      ];

      const cells = await table.getCellTexts();
      expect(cells).toEqual(expectedRows);
    });
  });

  describe('NFS 4', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          activeNfsType: NfsType.Nfs4,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTable2Harness);
    });

    it('shows NFS 4 table once is switched', async () => {
      const expectedRows = [
        [
          'Name',
          'Client ID',
          'Address',
          'Status',
          'Seconds From Last Renew',
        ],
        [
          'Linux NFSv4.2 debian12-hv',
          '6273260596088110000',
          '192.168.40.247:790',
          'Confirmed',
          '45',
        ],
      ];

      const cells = await table.getCellTexts();
      expect(cells).toEqual(expectedRows);
    });
  });
});
