import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnEmptyComponent } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
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
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class DataProtectionDashboardComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected readonly searchableElements = dataProtectionDashboardElements;
  protected readonly requiredRoles = [Role.PoolWrite];

  // tn-empty has no role-gating input, so the action is withheld (no `actionText`)
  // instead of the button being removed by *ixRequiresRoles as it was on ix-empty.
  protected readonly canCreatePool = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  protected createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  readonly pools = toSignal(this.api.call('pool.query', [[], { count: true }]) as unknown as Observable<number>, { initialValue: null });
}
