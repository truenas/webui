import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { SmbOpenFilesComponent } from './smb-open-files.component';

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
        share_file_id: '69',
        sharemode: {
          hex: '0x00000007', READ: true, WRITE: true, DELETE: true, text: 'RWD',
        },
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
        caching: {
          READ: false, WRITE: false, HANDLE: false, hex: '0x00000000', text: '',
        },
        oplock: {},
        lease: {},
        opened_at: '2023-10-26T12:17:27.190608+02:00',
      },
      '2102401/70': {
        server_id: {
          pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749',
        },
        uid: 3005,
        share_file_id: '70',
        sharemode: {
          hex: '0x00000007', READ: true, WRITE: true, DELETE: true, text: 'RWD',
        },
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
        caching: {
          READ: false, WRITE: false, HANDLE: false, hex: '0x00000000', text: '',
        },
        oplock: {},
        lease: {},
        opened_at: '2023-10-26T12:18:27.190608+02:00',
      },
    },
  },
];

describe('SmbOpenFilesComponent', () => {
  let spectator: Spectator<SmbOpenFilesComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: SmbOpenFilesComponent,
    imports: [IxTable2Module],
    providers: [],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        lock: locks[0],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      [
        'Server',
        'UID',
        'Opened at',
      ],
      [
        '2102401:0:4294967295:4458796888113407749',
        '3004',
        '2023-10-26T12:17:27.190608+02:00',
      ],
      [
        '2102401:0:4294967295:4458796888113407749',
        '3005',
        '2023-10-26T12:18:27.190608+02:00',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
