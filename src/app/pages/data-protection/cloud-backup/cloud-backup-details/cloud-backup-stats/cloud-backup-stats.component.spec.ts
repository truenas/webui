import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  CloudBackupStatsComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-stats/cloud-backup-stats.component';

const testBackup = {
  path: '/mnt/test',
  cache_path: '/mnt/cache',
  post_script: 'test',
  pre_script: 'test',
  attributes: {
    folder: '/ix',
    bucket: 'ixsystems',
  } as Record<string, string>,
  keep_last: 5,
  rate_limit: 500000,
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
    expect(chartExtra).toHaveLength(10);
    expect(chartExtra[0]).toHaveText('Path: /mnt/test');
    expect(chartExtra[1]).toHaveText('Cache Path: /mnt/cache');
    expect(chartExtra[2]).toHaveText('Credentials: Storj');
    expect(chartExtra[3]).toHaveText('Bucket: ixsystems');
    expect(chartExtra[4]).toHaveText('Folder: /ix');
    expect(chartExtra[5]).toHaveText('Keep Last: 5');
    expect(chartExtra[6]).toHaveText('Rate Limit: 488.28 MiB/s');
    expect(chartExtra[7]).toHaveText('Transfer Setting: Fast Storage');
    expect(chartExtra[8]).toHaveText('Post Script: test');
    expect(chartExtra[9]).toHaveText('Pre Script: test');
  });

  it('renders "No limit" when rate_limit is null', () => {
    const testBackupWithoutRateLimit = {
      ...testBackup,
      rate_limit: null,
    } as CloudBackup;
    spectator.setInput('backup', testBackupWithoutRateLimit);
    spectator.detectChanges();

    const chartExtra = spectator.query('mat-card-content')!.querySelectorAll('p');
    expect(chartExtra[6]).toHaveText('Rate Limit: No limit');
  });

  it('formats rate limit correctly for smaller values', () => {
    const testBackupWithSmallRateLimit = {
      ...testBackup,
      rate_limit: 1000,
    } as CloudBackup;
    spectator.setInput('backup', testBackupWithSmallRateLimit);
    spectator.detectChanges();

    const chartExtra = spectator.query('mat-card-content')!.querySelectorAll('p');
    expect(chartExtra[6]).toHaveText('Rate Limit: 1000 KiB/s');
  });
});
