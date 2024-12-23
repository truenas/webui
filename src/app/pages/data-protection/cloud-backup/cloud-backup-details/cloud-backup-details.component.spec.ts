import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import {
  CloudBackupDetailsComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import {
  CloudBackupExcludedPathsComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-excluded-paths/cloud-backup-excluded-paths.component';
import {
  CloudBackupScheduleComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-schedule/cloud-backup-schedule.component';
import {
  CloudBackupSnapshotsComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-snapshots/cloud-backup-snapshots.component';
import {
  CloudBackupStatsComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-stats/cloud-backup-stats.component';

describe('CloudBackupDetailsComponent', () => {
  const testBackup = {
    exclude: [
      '/mnt/tank1',
    ],
  } as CloudBackup;

  let spectator: Spectator<CloudBackupDetailsComponent>;
  const createComponent = createComponentFactory({
    component: CloudBackupDetailsComponent,
    declarations: [
      MockComponents(
        CloudBackupScheduleComponent,
        CloudBackupStatsComponent,
        CloudBackupExcludedPathsComponent,
        CloudBackupSnapshotsComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        backup: testBackup,
      },
    });
  });

  it('renders backup schedule', () => {
    const component = spectator.query(CloudBackupScheduleComponent)!;
    expect(component).toExist();
    expect(component.backup).toBe(testBackup);
  });

  it('renders backup stats', () => {
    const component = spectator.query(CloudBackupStatsComponent)!;
    expect(component).toExist();
    expect(component.backup).toBe(testBackup);
  });

  it('renders backup excluded paths when exclude paths are not empty', () => {
    const component = spectator.query(CloudBackupExcludedPathsComponent)!;
    expect(component).toExist();
    expect(component.backup).toBe(testBackup);
  });

  it('renders backup snapshots', () => {
    const component = spectator.query(CloudBackupSnapshotsComponent)!;
    expect(component).toExist();
    expect(component.backup).toBe(testBackup);
  });
});
