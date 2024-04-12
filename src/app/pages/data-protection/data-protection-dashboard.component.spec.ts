import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import {
  CloudBackupCardComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-card/cloud-backup-card.component';
import { CloudSyncTaskCardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { DataProtectionDashboardComponent } from 'app/pages/data-protection/data-protection-dashboard.component';
import { ReplicationTaskCardComponent } from 'app/pages/data-protection/replication/replication-task-card/replication-task-card.component';
import { RsyncTaskCardComponent } from 'app/pages/data-protection/rsync-task/rsync-task-card/rsync-task-card.component';
import { ScrubTaskCardComponent } from 'app/pages/data-protection/scrub-task/scrub-task-card/scrub-task-card.component';
import { SmartTaskCardComponent } from 'app/pages/data-protection/smart-task/smart-task-card/smart-task-card.component';
import { SnapshotTaskCardComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.component';

describe('DataProtectionDashboardComponent', () => {
  let spectator: Spectator<DataProtectionDashboardComponent>;
  const createComponent = createComponentFactory({
    component: DataProtectionDashboardComponent,
    declarations: [
      MockComponents(
        CloudBackupCardComponent,
        ScrubTaskCardComponent,
        CloudSyncTaskCardComponent,
        SnapshotTaskCardComponent,
        RsyncTaskCardComponent,
        ReplicationTaskCardComponent,
        SmartTaskCardComponent,
      ),
    ],
    providers: [],
    imports: [],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders data protection cards', () => {
    expect(spectator.query(CloudBackupCardComponent)).toExist();
    expect(spectator.query(ScrubTaskCardComponent)).toExist();
    expect(spectator.query(CloudSyncTaskCardComponent)).toExist();
    expect(spectator.query(SnapshotTaskCardComponent)).toExist();
    expect(spectator.query(RsyncTaskCardComponent)).toExist();
    expect(spectator.query(ReplicationTaskCardComponent)).toExist();
    expect(spectator.query(SmartTaskCardComponent)).toExist();
  });
});
