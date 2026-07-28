import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCardComponent } from '@truenas/ui-components';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { CloudBackupExcludedPathsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-excluded-paths/cloud-backup-excluded-paths.component';

const testBackup = {
  exclude: ['/mnt/test-1', '/mnt/test-2'],
} as CloudBackup;

describe('CloudBackupExcludedPathsComponent', () => {
  let spectator: Spectator<CloudBackupExcludedPathsComponent>;

  const createComponent = createComponentFactory({
    component: CloudBackupExcludedPathsComponent,
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
    // Read the tn-card input rather than its internal <h3>, which is library markup.
    expect(spectator.query(TnCardComponent)!.title()).toBe('Excluded Paths');
  });

  it('renders Excluded Paths in card', () => {
    const chartExtra = spectator.queryAll('tn-card p');
    expect(chartExtra).toHaveLength(2);
    expect(chartExtra[0]).toHaveText('/mnt/test-1');
    expect(chartExtra[1]).toHaveText('/mnt/test-2');
  });
});
