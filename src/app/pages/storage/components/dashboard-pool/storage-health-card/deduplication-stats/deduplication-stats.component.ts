import { ChangeDetectionStrategy, Component, DestroyRef, computed, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { getZpoolPropertyNumber, getZpoolPropertyString, Zpool } from 'app/interfaces/zpool.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  PruneDedupTableDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/prune-dedup-table-dialog/prune-dedup-table-dialog.component';
import {
  SetDedupQuotaComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/set-dedup-quota/set-dedup-quota.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';

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
  private fileSizePipe = inject(FileSizePipe);
  private matDialog = inject(MatDialog);
  private store = inject(PoolsDashboardStore);
  private destroyRef = inject(DestroyRef);

  pool = input.required<Zpool>();

  protected readonly Role = Role;

  protected dedupTableSize = computed(() => getZpoolPropertyNumber(this.pool(), 'dedup_table_size'));

  protected deduplicationStats = computed(() => {
    const dedupTableSize = this.dedupTableSize();
    const dedupTableQuota = getZpoolPropertyString(this.pool(), 'dedup_table_quota');
    if (dedupTableQuota !== 'auto' && dedupTableQuota !== '0') {
      const value = this.fileSizePipe.transform(dedupTableSize);
      const quota = this.fileSizePipe.transform(parseInt(dedupTableQuota || '', 10));
      return `${value} / ${quota}`;
    }

    return this.fileSizePipe.transform(dedupTableSize);
  });

  protected onPruneDedupTable(): void {
    this.matDialog
      .open(PruneDedupTableDialog, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.loadDashboard());
  }

  protected onSetDedupQuota(): void {
    this.matDialog
      .open(SetDedupQuotaComponent, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.loadDashboard());
  }
}
