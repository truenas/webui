import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  PruneDedupTableDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/prune-dedup-table-dialog/prune-dedup-table-dialog.component';
import {
  SetDedupQuotaComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/set-dedup-quota/set-dedup-quota.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-deduplication-stats',
  templateUrl: './deduplication-stats.component.html',
  styleUrls: ['./deduplication-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
  providers: [FileSizePipe],
})
export class DeduplicationStatsComponent {
  pool = input.required<Pool>();

  protected readonly Role = Role;

  constructor(
    private fileSizePipe: FileSizePipe,
    private matDialog: MatDialog,
    private store: PoolsDashboardStore,
  ) {}

  protected deduplicationStats = computed(() => {
    if (this.pool().dedup_table_quota !== 'auto' && this.pool().dedup_table_quota !== '0') {
      const value = this.fileSizePipe.transform(this.pool().dedup_table_size);
      const quota = this.fileSizePipe.transform(parseInt(this.pool().dedup_table_quota || '', 10));
      return `${value} / ${quota}`;
    }

    return this.fileSizePipe.transform(this.pool().dedup_table_size);
  });

  protected onPruneDedupTable(): void {
    this.matDialog
      .open(PruneDedupTableDialog, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  protected onSetDedupQuota(): void {
    this.matDialog
      .open(SetDedupQuotaComponent, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }
}
