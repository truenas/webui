import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, OnChanges, signal, inject, Signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus, poolStatusLabels } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { VDevItem, TopologyItemStats } from 'app/interfaces/storage.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ScrubFormComponent,
} from 'app/pages/storage/components/dashboard-pool/disk-health-card/scrub-form/scrub-form.component';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  ActivePoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/active-pool-scan/active-pool-scan.component';
import {
  AutotrimDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/autotrim-dialog/autotrim-dialog.component';
import {
  DeduplicationStatsComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/deduplication-stats/deduplication-stats.component';
import {
  DiskErrorsDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/disk-errors-dialog/disk-errors-dialog.component';
import {
  LastPoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/last-pool-scan/last-pool-scan.component';
import { storageHealthCardElements } from 'app/pages/storage/components/dashboard-pool/storage-health-card/storage-health-card.elements';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

enum AutoTrimValue {
  On = 'on',
  Off = 'off',
}

interface StatusIconData {
  tooltip: string;
  icon: PoolCardIconType;
}

/**
 * helper function to flatten a disk topology recursively.
 * @param topo the topology to flatten.
 * @returns a `VDevItem[]` with all children of all items concatenated.
 */
const flattenDiskTopology = (topo: VDevItem[] | VDevItem[][]): VDevItem[] => {
  const extraFlat = topo.flat();
  return extraFlat.reduce((allItems: VDevItem[], item: VDevItem) => {
    const children = (item.type !== TopologyItemType.Disk && item?.children)
      ? flattenDiskTopology(item.children)
      : [];

    // accumulate all errors so far
    return [...allItems, item, ...children];
  }, []);
};

/**
 * helper function to count errors in a disk topology.
 * @param pred predicate that determines whether not a particular topology item should have
 *        its errors counted.
 * @param items (flattened) topology to count errors within.
 * @returns the sum of read, write, and checksum errors in all devices satisfying `pred`.
 */
const countErrors = (pred: (arg0: VDevItem) => boolean, items: VDevItem[] | VDevItem[][]): number => {
  const flattened = flattenDiskTopology(items);
  return flattened.reduce((count: number, item: VDevItem): number => {
    const stats = item?.stats;
    if (pred(item) && stats) {
      return count + stats.read_errors + stats.write_errors + stats.checksum_errors;
    }

    return count + 0;
  }, 0);
};

@UntilDestroy()
@Component({
  selector: 'ix-storage-health-card',
  templateUrl: './storage-health-card.component.html',
  styleUrls: ['./storage-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatCardHeader,
    MatCardTitle,
    PoolCardIconComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    TranslateModule,
    TooltipComponent,
    ActivePoolScanComponent,
    LastPoolScanComponent,
    ScheduleDescriptionPipe,
    DeduplicationStatsComponent,
  ],
})
export class StorageHealthCardComponent implements OnChanges {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);
  private store = inject(PoolsDashboardStore);
  private slideIn = inject(SlideIn);
  private router = inject(Router);

  readonly pool = input.required<Pool>();

  readonly scrub = computed(() => this.store.scrubForPool(this.pool()));

  protected readonly searchableElements = storageHealthCardElements;

  protected scan = signal<PoolScanUpdate | null>(null);

  totalZfsErrors = 0;
  poolScanSubscription: Subscription;

  protected readonly helptextVolumes = helptextVolumes;

  readonly poolStatusLabels = poolStatusLabels;
  protected readonly Role = Role;
  protected readonly AutoTrimValue = AutoTrimValue;

  protected readonly wasScanInitiated = computed(() => this.scan()?.state === PoolScanState.Scanning);
  protected readonly isScrub = computed(() => this.scan()?.function === PoolScanFunction.Scrub);

  protected iconData: Signal<StatusIconData> = computed(() => {
    const pool = this.pool();
    const statusStr = this.poolStatusLabels.get(pool.status);
    let tooltip: string;
    let icon: PoolCardIconType;

    if (!pool.healthy && pool.status === PoolStatus.Online) {
      tooltip = this.translate.instant('Pool is {status} with errors', { status: statusStr });
      icon = PoolCardIconType.Warn;
    } else if (pool.status === PoolStatus.Degraded || pool.status === PoolStatus.Faulted) {
      tooltip = this.translate.instant('Pool status is {status}', { status: statusStr });
      icon = pool.status === PoolStatus.Degraded ? PoolCardIconType.Warn : PoolCardIconType.Error;
    } else if (!pool.healthy) {
      tooltip = this.translate.instant('Pool is not healthy');
      icon = PoolCardIconType.Error;
    } else {
      tooltip = this.translate.instant('Everything is fine');
      icon = PoolCardIconType.Safe;
    }

    return {
      tooltip,
      icon,
    };
  });

  protected iconType = computed(() => this.iconData().icon);
  protected iconTooltip = computed(() => this.iconData().tooltip);

  ngOnChanges(): void {
    this.scan.set(this.pool().scan);

    this.subscribeToScan();
    this.calculateTotalZfsErrors();
  }

  protected onStartScrub(): void {
    const message = this.translate.instant('Start scrub on pool <i>{poolName}</i>?', { poolName: this.pool().name });
    this.dialogService.confirm({
      message,
      hideCheckbox: true,
      title: this.translate.instant('Scrub Pool'),
      buttonText: this.translate.instant('Start Scrub'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Start])),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  protected onEditAutotrim(): void {
    this.matDialog
      .open(AutotrimDialog, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  private subscribeToScan(): void {
    if (this.poolScanSubscription && !this.poolScanSubscription.closed) {
      this.poolScanSubscription.unsubscribe();
    }
    this.poolScanSubscription = this.api.subscribe('pool.scan')
      .pipe(
        map((apiEvent) => apiEvent.fields),
        filter((scan) => scan.name === this.pool().name),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((scan) => {
        this.scan.set(scan.scan);
        this.cdr.markForCheck();
      });
  }

  protected onConfigureScrub(): void {
    this.slideIn.open(ScrubFormComponent, {
      data: {
        poolId: this.pool().id,
        existingScrubTask: this.scrub(),
      },
    })
      .pipe(
        filter((result) => result?.response),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.store.loadDashboard();
      });
  }

  protected getErrorText(): string {
    const errorCount = this.countVdevErrors() + this.countPhysDiskErrors();

    const statusStr = poolStatusLabels.get(this.pool().status);
    const errorStr = this.translate.instant('{count} errors', { count: errorCount });

    if (errorCount === 0) {
      return this.translate.instant('{status}, no errors.', { status: statusStr });
    }

    return this.translate.instant('{statusStr}, {errorStr}.', {
      statusStr,
      errorStr,
    });
  }

  protected hasErrors(): boolean {
    return (this.countPhysDiskErrors() + this.countVdevErrors()) > 0;
  }

  /**
   * opens a dialog `DiskErrorsDialogComponent` with all the current
   * disk errors listed for the user.
   */
  protected openDiskErrorDialog(): void {
    const poolId = this.pool().id;
    const poolName = this.pool().name;
    const topo = Object.values(this.pool().topology);

    const getDiskName = (disk: VDevItem): string => {
      if (disk.disk) {
        return `/dev/${disk.disk}`;
      }

      return disk?.path || disk?.name || disk?.guid?.toString() || 'Unnamed disk';
    };

    const disksWithErrors = flattenDiskTopology(topo)
      .filter((item: VDevItem) => {
        const stats: TopologyItemStats | undefined = item?.stats;
        if (!stats) {
          return false;
        }
        const sum = stats.read_errors + stats.write_errors + stats.checksum_errors;
        return sum > 0;
      })
      .map((item: VDevItem) => ({
        guid: item?.guid?.toString() || 'unknown',
        name: getDiskName(item),
        kind: item.type === TopologyItemType.Disk ? 'physical' : 'vdev',
        errorCount: {
          read: item.stats?.read_errors || 0,
          write: item.stats?.write_errors || 0,
          checksum: item.stats?.checksum_errors || 0,
        },
      }));

    this.matDialog.open(DiskErrorsDialogComponent, {
      data: {
        poolId,
        poolName,
        disks: disksWithErrors,
      },
    });
  }

  /**
   * counts the number of errors on all VDEVs in the pool's topology. this
   * explicitly does *not* include physical disks.
   * @returns number of errors ZFS reports on the top-level VDEVs
   */
  private countVdevErrors(): number {
    const topo = Object.values(this.pool().topology);
    return countErrors((item) => item.type !== TopologyItemType.Disk, topo);
  }

  /**
   * companion function to `countVdevErrors` which returns *only* the number of
   * physical disk errors and ignores all VDEV components.
   * @returns number of errors ZFS reports on the physical disks themselves.
   */
  private countPhysDiskErrors(): number {
    const topo = Object.values(this.pool().topology);
    return countErrors((item) => item.type === TopologyItemType.Disk, topo.flat());
  }

  private calculateTotalZfsErrors(): void {
    if (!this.pool().topology) {
      return;
    }
    this.totalZfsErrors = this.countVdevErrors();
  }
}
