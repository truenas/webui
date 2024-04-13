import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CloudBackupStatsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-stats/cloud-backup-stats.component';

const testBackup = {
  args: 'test',
  path: '/mnt/test',
  post_script: 'test',
  pre_script: 'test',
} as CloudBackup;

describe('CloudBackupStatsComponent', () => {
  let spectator: Spectator<CloudBackupStatsComponent>;

  const createComponent = createComponentFactory({
    component: CloudBackupStatsComponent,
    imports: [
      IxTable2Module,
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
    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');
    expect(chartExtra).toHaveLength(4);
    expect(chartExtra[0]).toHaveText('Args: test');
    expect(chartExtra[1]).toHaveText('Path: /mnt/test');
    expect(chartExtra[2]).toHaveText('Post Script: test');
    expect(chartExtra[3]).toHaveText('Pre Script: test');
  });
});
