import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { countDisksTotal } from 'app/helpers/count-disks-total.helper';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { isTopologyDisk } from 'app/interfaces/storage.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetStaleDataNoticeComponent } from 'app/pages/dashboard/components/widget-stale-data-notice/widget-stale-data-notice.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  ItemInfo, PoolInfo, statusIcons, StatusLevel,
} from 'app/pages/dashboard/widgets/storage/interfaces/pool-info.interface';

@Component({
  selector: 'ix-widget-storage',
  templateUrl: './widget-storage.component.html',
  styleUrl: './widget-storage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormatDateTimePipe, PercentPipe],
  imports: [
    MatCard,
    MatCardContent,
    MatIconButton,
    TestDirective,
    MatTooltip,
    RouterLink,
    IxIconComponent,
    MatGridList,
    MatGridTile,
    RequiresRolesDirective,
    NgxSkeletonLoaderModule,
    TranslateModule,
    WidgetStaleDataNoticeComponent,
  ],
})
export class WidgetStorageComponent {
  private resources = inject(WidgetResourcesService);
  private translate = inject(TranslateService);
  private formatDateTimePipe = inject(FormatDateTimePipe);
  private percentPipe = inject(PercentPipe);

  size = input.required<SlotSize>();

  protected poolDataState = toSignal(
    this.resources.poolUpdatesWithStaleDetection().pipe(takeUntilDestroyed()),
  );

  protected scanState = toSignal(this.resources.scanUpdatesWithStaleDetection().pipe(takeUntilDestroyed()));

  protected isStale = computed(() => this.poolDataState()?.isStale ?? false);
  protected isLoading = computed(() => (!this.pools() || !this.poolStats()) && !this.isStale());
  poolsInfo = computed(() => {
    const pools = this.pools();

    const poolsInfo: PoolInfo[] = [];

    if (pools && this.poolStats()) {
      pools.forEach((pool) => {
        poolsInfo.push({
          name: pool.name,
          topology: pool.topology,
          status: this.getStatusItemInfo(pool),
          usedSpace: this.getUsedSpaceItemInfo(pool),
          disksWithError: this.getDiskWithErrorsItemInfo(pool),
          scan: this.getScanItemInfo(pool),
          freeSpace: this.getFreeSpace(pool),
          totalDisks: this.getTotalDisks(pool),
        });
      });
    }

    return poolsInfo;
  });

  protected poolStats = computed(() => {
    return this.poolDataState()?.value;
  });

  protected readonly requiredRoles = [Role.PoolWrite];

  private pools = toSignal(this.resources.pools$);

  get isTwoTilesInRow(): boolean {
    return Number(this.pools()?.length) > 2;
  }

  get isThreeTilesInColumn(): boolean {
    return Number(this.pools()?.length) > 4;
  }

  get showCreatePool(): boolean {
    return Number(this.pools()?.length) < 6
      && (Number(this.pools()?.length) % 2 === 1 || this.pools()?.length === 0);
  }

  getColumnsInTile(poolName: string): number {
    if (this.isTwoTilesInRow) {
      return 1;
    }

    const existingPool = this.pools()?.find((pool) => pool.name === poolName);
    const badStatus = existingPool && [
      PoolStatus.Locked,
      PoolStatus.Unknown,
      PoolStatus.Offline,
      PoolStatus.Degraded,
    ].includes(existingPool.status);

    if (badStatus || !existingPool?.topology) {
      return 2;
    }

    return 3;
  }

  private getStatusItemInfo(pool: Pool): ItemInfo {
    let level = StatusLevel.Safe;
    let icon: MarkedIcon = statusIcons.checkCircle;
    let value: string = pool.status;

    switch (pool.status) {
      case PoolStatus.Online:
        if (!pool.healthy) {
          level = StatusLevel.Warn;
          icon = statusIcons.mdiAlert;
          value = this.translate.instant('Unhealthy');
        }
        break;

      case PoolStatus.Healthy:
        break;

      case PoolStatus.Locked:
      case PoolStatus.Unknown:
      case PoolStatus.Offline:
      case PoolStatus.Degraded:
        level = StatusLevel.Warn;
        icon = statusIcons.error;
        break;

      case PoolStatus.Faulted:
      case PoolStatus.Unavailable:
      case PoolStatus.Removed:
        level = StatusLevel.Error;
        icon = statusIcons.mdiCloseCircle;
        break;
    }

    return {
      label: this.translate.instant('Pool Status'),
      level,
      icon,
      value,
    };
  }

  private getUsedSpaceItemInfo(pool: Pool): ItemInfo {
    const usedSpace = Number(this.poolStats()?.[pool.name]?.used);
    const totalSpace = Number(this.poolStats()?.[pool.name]?.total);
    const usedSpacePercent = usedSpace / totalSpace;
    let level = StatusLevel.Safe;
    let icon = statusIcons.checkCircle;
    let value = this.percentPipe.transform(usedSpacePercent, '1.2-2') || '?';

    if (!usedSpace) {
      return {
        label: this.translate.instant('Used Space'),
        value: this.translate.instant('Unknown'),
        level: StatusLevel.Warn,
        icon: statusIcons.error,
      };
    }

    if (this.getColumnsInTile(pool.name) < 3) {
      value = this.translate.instant('{used} of {total} ({used_pct})', {
        used: buildNormalizedFileSize(usedSpace),
        total: buildNormalizedFileSize(totalSpace),
        used_pct: value,
      });
    }

    if (usedSpacePercent >= 90) {
      level = StatusLevel.Error;
      icon = statusIcons.error;
    } else if (usedSpacePercent >= 80) {
      level = StatusLevel.Warn;
      icon = statusIcons.error;
    }

    return {
      label: this.translate.instant('Used Space'),
      value,
      level,
      icon,
    };
  }

  private getDiskWithErrorsItemInfo(pool: Pool): ItemInfo {
    let level = StatusLevel.Warn;
    let icon = statusIcons.error;
    let unhealthyCount: number | null = null;
    let value: string = this.translate.instant('Unknown');

    if (pool?.topology) {
      const unhealthy: string[] = []; // Disks with errors
      pool.topology.data.forEach((item) => {
        if (isTopologyDisk(item)) {
          const diskErrors = item.stats.read_errors + item.stats.write_errors + item.stats.checksum_errors;

          if (diskErrors > 0) {
            unhealthy.push(item.disk);
          }
        } else {
          item.children.forEach((device) => {
            const diskErrors = device.stats.read_errors + device.stats.write_errors + device.stats.checksum_errors;

            if (diskErrors > 0) {
              unhealthy.push(device.disk);
            }
          });
        }
      });
      if (unhealthy.length === 0) {
        unhealthyCount = 0;
        level = StatusLevel.Safe;
        icon = statusIcons.checkCircle;
      } else {
        level = StatusLevel.Warn;
        icon = statusIcons.error;
        unhealthyCount = unhealthy.length;
      }

      value = this.translate.instant('{unhealthy} of {total}', {
        unhealthy: String(unhealthyCount),
        total: this.getTotalDisks(pool),
      });
    }

    return {
      label: this.translate.instant('Disks with Errors'),
      value,
      level,
      icon,
    };
  }

  /** helper function to format the scrub/resilver percentage displayed on the dashboard.
   * in some cases, we get an API value that is already a percentage (i.e. not a fraction between 0 and 1)
   * and in other cases we get a fraction between 0 and 1. the discrepancy here is due to us getting
   * scan data from two different places: `pool.query` and `zfs.pool.scan`. the former gives us a percentage,
   * while the latter gives us a fraction between 0 and 1.
   */
  private formatScanPercentage(scan: PoolScanUpdate): string {
    let donePercentage = scan.percentage;
    if (donePercentage >= 1) {
      donePercentage /= 100;
    }

    return this.percentPipe.transform(donePercentage, '1.2-2') || '?';
  }

  private getScanItemInfo(pool: Pool): ItemInfo {
    let level: StatusLevel;
    let icon: MarkedIcon;
    let value: string;

    const scanUpdate = this.scanState();
    let scan = pool.scan;
    if (!scanUpdate.isStale && scanUpdate?.value?.name === pool.name) {
      scan = scanUpdate.value.scan;
    }

    const isScrub = scan?.function === PoolScanFunction.Scrub;
    const isScanFinished = scan?.state === PoolScanState.Finished;
    const isScanInProgress = scan?.state === PoolScanState.Scanning;
    const endTime = scan?.end_time?.$date;

    const label = isScrub
      ? this.translate.instant('Last Scrub')
      : this.translate.instant('Last Resilver');

    if (!endTime && isScanInProgress) {
      // case: scan is in progress.
      icon = statusIcons.arrowCircleRight;
      level = StatusLevel.Safe;
      value = this.formatScanPercentage(scan);
    } else if (endTime && !isScanInProgress) {
      // case: scan is finished.
      icon = isScanFinished ? statusIcons.checkCircle : statusIcons.error;
      level = isScanFinished ? StatusLevel.Safe : StatusLevel.Warn;
      value = this.formatDateTimePipe.transform(endTime);
    } else {
      // case: if it's not done nor in progress, **we assume it has not run**.
      icon = statusIcons.neutral;
      level = StatusLevel.Neutral;
      value = this.translate.instant('Never');
    }

    return {
      label,
      value,
      level,
      icon,
    };
  }

  private getFreeSpace(pool: Pool): string {
    const availableSpace = this.poolStats()?.[pool.name]?.available;

    if (!availableSpace) {
      return this.translate.instant('Unknown');
    }

    return buildNormalizedFileSize(this.poolStats()[pool.name].available);
  }

  private getTotalDisks(pool: Pool): string {
    if (pool?.topology) {
      return countDisksTotal(pool.topology);
    }

    return this.translate.instant('Unknown');
  }
}
