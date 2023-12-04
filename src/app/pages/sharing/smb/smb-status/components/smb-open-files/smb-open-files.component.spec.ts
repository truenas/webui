import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
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
        lock: locks[0] as SmbLockInfo,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      [
        'Server',
        'Username',
        'Opened at',
      ],
      [
        '2102401:0:4294967295:4458796888113407749',
        'michelangelo (3004)',
        '2023-10-26T12:17:27.190608+02:00',
      ],
      [
        '2102401:0:4294967295:4458796888113407749',
        'donatello (3005)',
        '2023-10-26T12:18:27.190608+02:00',
      ],
      [
        '2102401:0:4294967295:4458796888113407749',
        'raphael (3006)',
        '2023-10-26T10:10:10.190608+02:00',
      ],
      [
        '2102401:0:4294967295:4458796888113407749',
        'leonardo (3007)',
        '2023-10-26T10:10:10.190608+02:00',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
