import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { dataProtectionEmptyConfig } from 'app/constants/empty-configs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { dataProtectionDashboardElements } from 'app/pages/data-protection/data-protection-dashboard.elements';
import { CloudBackupCardComponent } from './cloud-backup/cloud-backup-card/cloud-backup-card.component';
import { CloudSyncTaskCardComponent } from './cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { ReplicationTaskCardComponent } from './replication/replication-task-card/replication-task-card.component';
import { RsyncTaskCardComponent } from './rsync-task/rsync-task-card/rsync-task-card.component';
import { SnapshotTaskCardComponent } from './snapshot-task/snapshot-task-card/snapshot-task-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-data-protection-dashboard',
  templateUrl: './data-protection-dashboard.component.html',
  styleUrls: ['./data-protection-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiSearchDirective,
    CloudBackupCardComponent,
    CloudSyncTaskCardComponent,
    SnapshotTaskCardComponent,
    RsyncTaskCardComponent,
    ReplicationTaskCardComponent,
    EmptyComponent,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class DataProtectionDashboardComponent {
  protected readonly searchableElements = dataProtectionDashboardElements;
  protected readonly requiredRoles = [Role.PoolWrite];

  emptyConfig: EmptyConfig = {
    ...dataProtectionEmptyConfig,
    button: {
      label: this.translate.instant('Create Pool'),
      action: () => this.router.navigate(['/storage', 'create']),
    },
  };

  readonly pools = toSignal(this.api.call('pool.query'), { initialValue: null });

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private router: Router,
  ) {}
}
