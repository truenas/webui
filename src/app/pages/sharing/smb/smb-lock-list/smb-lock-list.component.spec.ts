import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { SmbLockInfo } from 'app/interfaces/smb-status.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SmbLockListComponent } from 'app/pages/sharing/smb/smb-lock-list/smb-lock-list.component';

describe('SmbLockListComponent', () => {
  let spectator: Spectator<SmbLockListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const locks = [
    {
      service_path: '/mnt/APPS/turtles',
      filename: '.',
      fileid: { devid: 70, inode: 3, extid: 0 },
      num_pending_deletes: 0,
      opens: {
        '2102401/69': {
          server_id: { pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749' },
          uid: 3004,
          share_file_id: '69',
          sharemode: { hex: '0x00000007', READ: true, WRITE: true, DELETE: true, text: 'RWD' },
          access_mask: {
            hex: '0x00100081',
            READ_DATA: true,
            WRITE_DATA: false,
            APPEND_DATA: false,
            READ_EA: false,
            WRITE_EA: false,
            EXECUTE: false,
            READ_ATTRIBUTES: true,
            WRITE_ATTRIBUTES: false,
            DELETE_CHILD: false,
            DELETE: false,
            READ_CONTROL: false,
            WRITE_DAC: false,
            SYNCHRONIZE: true,
            ACCESS_SYSTEM_SECURITY: false,
            text: 'R',
          },
          caching: { READ: false, WRITE: false, HANDLE: false, hex: '0x00000000', text: '' },
          oplock: {},
          lease: {},
          opened_at: '2023-10-26T12:17:27.190608+02:00',
        },
      },
    },
  ] as SmbLockInfo[];

  const createComponent = createComponentFactory({
    component: SmbLockListComponent,
    imports: [AppLoaderModule, EntityModule, IxTable2Module],
    providers: [mockWebsocket([
      mockCall('smb.status', locks),
    ])],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      [
        'Path',
        'Filename',
        'Num Pending Deletes',
        'Dev Id',
        'Ext Id',
        'Inode',
      ],
      [
        '/mnt/APPS/turtles',
        '.',
        '0',
        '70',
        '0',
        '3',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
