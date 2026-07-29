import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnEmptyComponent } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { dataProtectionEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { flattenEmptyConfigMessage } from 'app/helpers/empty-config.helper';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
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
  ],
})
export class DataProtectionDashboardComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  protected readonly searchableElements = dataProtectionDashboardElements;
  protected readonly requiredRoles = [Role.PoolWrite];

  protected readonly emptyTitle = dataProtectionEmptyConfig.title;

  // Reuse the catalog string rather than a reworded one — it is translated in every
  // locale. It carries the `<br>` markup ix-empty rendered as HTML, and tn-empty's
  // [description] is a text input, so flatten the markup to whitespace.
  protected readonly emptyDescription = flattenEmptyConfigMessage(
    this.translate.instant(dataProtectionEmptyConfig.message),
  );

  protected createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  readonly pools = toSignal(this.api.call('pool.query', [[], { count: true }]) as unknown as Observable<number>, { initialValue: null });
}
