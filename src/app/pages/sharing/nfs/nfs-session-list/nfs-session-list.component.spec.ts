import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { NfsSession } from 'app/interfaces/nfs-share.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { NfsSessionListComponent } from './nfs-session-list.component';

describe('NfsSessionListComponent', () => {
  let spectator: Spectator<NfsSessionListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

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
  ] as NfsSession[];

  const createComponent = createComponentFactory({
    component: NfsSessionListComponent,
    imports: [AppLoaderModule, EntityModule, IxTable2Module],
    providers: [mockWebsocket([mockCall('nfs.get_nfs3_clients', sessions)])],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      [
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
      ],
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
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
