import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  CloudBackupStatsComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-stats/cloud-backup-stats.component';

const testBackup = {
  path: '/mnt/test',
  post_script: 'test',
  pre_script: 'test',
  attributes: {
    folder: '/ix',
    bucket: 'ixsystems',
  } as Record<string, string>,
  keep_last: 5,
  credentials: {
    name: 'Storj',
  },
  transfer_setting: CloudsyncTransferSetting.FastStorage,
} as CloudBackup;

describe('CloudBackupStatsComponent', () => {
  let spectator: Spectator<CloudBackupStatsComponent>;

  const createComponent = createComponentFactory({
    component: CloudBackupStatsComponent,
    imports: [
      MapValuePipe,
    ],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        backup: testBackup,
      },
    });
  });

  it('checks card title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Details');
  });

  it('renders Details in card', () => {
    const chartExtra = spectator.query('mat-card-content')!.querySelectorAll('p');
    expect(chartExtra).toHaveLength(8);
    expect(chartExtra[0]).toHaveText('Path: /mnt/test');
    expect(chartExtra[1]).toHaveText('Credentials: Storj');
    expect(chartExtra[2]).toHaveText('Bucket: ixsystems');
    expect(chartExtra[3]).toHaveText('Folder: /ix');
    expect(chartExtra[4]).toHaveText('Keep Last: 5');
    expect(chartExtra[5]).toHaveText('Transfer Setting: Fast Storage');
    expect(chartExtra[6]).toHaveText('Post Script: test');
    expect(chartExtra[7]).toHaveText('Pre Script: test');
  });
});
