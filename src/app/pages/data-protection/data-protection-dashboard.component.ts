import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { dataProtectionDashboardElements } from 'app/pages/data-protection/data-protection-dashboard.elements';
import { CloudBackupCardComponent } from './cloud-backup/cloud-backup-card/cloud-backup-card.component';
import { CloudSyncTaskCardComponent } from './cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { ReplicationTaskCardComponent } from './replication/replication-task-card/replication-task-card.component';
import { RsyncTaskCardComponent } from './rsync-task/rsync-task-card/rsync-task-card.component';
import { ScrubTaskCardComponent } from './scrub-task/scrub-task-card/scrub-task-card.component';
import { SmartTaskCardComponent } from './smart-task/smart-task-card/smart-task-card.component';
import { SnapshotTaskCardComponent } from './snapshot-task/snapshot-task-card/snapshot-task-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-data-protection-dashboard',
  templateUrl: './data-protection-dashboard.component.html',
  styleUrls: ['./data-protection-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiSearchDirective,
    CloudBackupCardComponent,
    ScrubTaskCardComponent,
    CloudSyncTaskCardComponent,
    SnapshotTaskCardComponent,
    RsyncTaskCardComponent,
    ReplicationTaskCardComponent,
    SmartTaskCardComponent,
  ],
})
export class DataProtectionDashboardComponent {
  protected readonly searchableElements = dataProtectionDashboardElements;
}
