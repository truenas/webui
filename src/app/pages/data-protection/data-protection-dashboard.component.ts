import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnEmptyComponent } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { dataProtectionEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { emptyConfigIcon } from 'app/helpers/empty-config.helper';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { dataProtectionDashboardElements } from 'app/pages/data-protection/data-protection-dashboard.elements';
import { CloudBackupCardComponent } from './cloud-backup/cloud-backup-card/cloud-backup-card.component';
import { CloudSyncTaskCardComponent } from './cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { ReplicationTaskCardComponent } from './replication/replication-task-card/replication-task-card.component';
import { RsyncTaskCardComponent } from './rsync-task/rsync-task-card/rsync-task-card.component';
import { SnapshotTaskCardComponent } from './snapshot-task/snapshot-task-card/snapshot-task-card.component';

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
    TnEmptyComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
    PageHeaderComponent,
    FlattenEmptyMessagePipe,
  ],
})
export class DataProtectionDashboardComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  protected readonly searchableElements = dataProtectionDashboardElements;
  protected readonly requiredRoles = [Role.PoolWrite];

  // Bound from the catalog rather than reworded inline — those strings are translated in
  // every locale. The message carries the `<br>` markup ix-empty rendered as HTML, and
  // tn-empty's [description] is a text input, so the template flattens it after translating.
  protected readonly emptyConfig = dataProtectionEmptyConfig;

  // Icon split out of the same config rather than hand-copied into the template, so
  // the catalog stays the single source of truth for the icon as well as the message.
  protected readonly emptyIcon = emptyConfigIcon(dataProtectionEmptyConfig);

  protected createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  readonly pools = toSignal(this.api.call('pool.query', [[], { count: true }]) as unknown as Observable<number>, { initialValue: null });
}
