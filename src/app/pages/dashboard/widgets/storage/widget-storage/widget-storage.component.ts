import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { Pool } from 'app/interfaces/pool.interface';
import { isTopologyDisk } from 'app/interfaces/storage.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
  standalone: true,
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
  ],
})
export class WidgetStorageComponent {
  size = input.required<SlotSize>();

  isLoading = computed(() => !this.pools() || !this.volumesData());
  poolsInfo = computed(() => {
    const volumesData = this.volumesData();
    const pools = this.pools();

    const poolsInfo: PoolInfo[] = [];

    if (pools && volumesData) {
      pools.forEach((pool) => {
        poolsInfo.push({
          name: pool.name,
          topology: pool.topology,
          status: this.getStatusItemInfo(pool),
          usedSpace: this.getUsedSpaceItemInfo(pool, volumesData),
          disksWithError: this.getDiskWithErrorsItemInfo(pool),
          scan: this.getScanItemInfo(pool),
          freeSpace: this.getFreeSpace(pool, volumesData),
          totalDisks: this.getTotalDisks(pool),
        });
      });
    }

    return poolsInfo;
  });

  readonly requiredRoles = [Role.FullAdmin];

  private pools = toSignal(this.resources.pools$);
  private volumesData = toSignal(this.resources.volumesData$);

  constructor(
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private formatDateTimePipe: FormatDateTimePipe,
    private percentPipe: PercentPipe,
  ) {}

  get isTwoTilesInRow(): boolean {
    return this.pools()?.length > 2;
  }

  get isThreeTilesInColumn(): boolean {
    return this.pools()?.length > 4;
  }

  get showCreatePool(): boolean {
    return this.pools()?.length < 6
      && (this.pools().length % 2 === 1 || this.pools()?.length === 0);
  }

  getColumnsInTile(poolName: string): number {
    if (this.isTwoTilesInRow) {
      return 1;
    }

    const existingPool = this.pools().find((pool) => pool.name === poolName);
    const badStatus = [
      PoolStatus.Locked,
      PoolStatus.Unknown,
      PoolStatus.Offline,
      PoolStatus.Degraded,
    ].includes(existingPool.status);

    if (badStatus || !existingPool.topology) {
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

  private getUsedSpaceItemInfo(pool: Pool, volumes: VolumesData): ItemInfo {
    let level = StatusLevel.Safe;
    let icon = statusIcons.checkCircle;
    let value = volumes.get(pool.name).used_pct;

    if (volumes.get(pool.name)?.used === null) {
      return {
        label: this.translate.instant('Used Space'),
        value: this.translate.instant('Unknown'),
        level: StatusLevel.Warn,
        icon: statusIcons.error,
      };
    }

    if (this.getColumnsInTile(pool.name) < 3) {
      value = this.translate.instant('{used} of {total} ({used_pct})', {
        used: buildNormalizedFileSize(volumes.get(pool.name).used),
        total: buildNormalizedFileSize(volumes.get(pool.name).used + volumes.get(pool.name).avail),
        used_pct: volumes.get(pool.name).used_pct,
      });
    }

    const percent = parseInt(volumes.get(pool.name).used_pct.split('%')[0]);

    if (percent >= 90) {
      level = StatusLevel.Error;
      icon = statusIcons.error;
    } else if (percent >= 80) {
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
    let value = this.translate.instant('Unknown');

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
        value = '0';
        level = StatusLevel.Safe;
        icon = statusIcons.checkCircle;
      } else {
        level = StatusLevel.Warn;
        icon = statusIcons.error;
        value = unhealthy.length.toString();
      }

      value = `${value} ${this.translate.instant('of')} ${this.getTotalDisks(pool)}`;
    }

    return {
      label: this.translate.instant('Disks with Errors'),
      value,
      level,
      icon,
    };
  }

  private getScanItemInfo(pool: Pool): ItemInfo {
    let level: StatusLevel;
    let icon: MarkedIcon;
    let value: string;

    const isScrub = pool.scan?.function === PoolScanFunction.Scrub;
    const isScanFinished = pool.scan?.state === PoolScanState.Finished;
    const isScanInProgress = pool.scan?.state === PoolScanState.Scanning;
    const endTime = pool?.scan?.end_time?.$date;

    const label = isScrub
      ? this.translate.instant('Last Scrub')
      : this.translate.instant('Last Resilver');

    if (endTime && isScanInProgress) {
      icon = statusIcons.arrowCircleRight;
      level = StatusLevel.Safe;
      value = this.percentPipe.transform(pool.scan.percentage, '1.2-2');
    } else if (endTime && !isScanInProgress) {
      icon = isScanFinished ? statusIcons.checkCircle : statusIcons.error;
      level = isScanFinished ? StatusLevel.Safe : StatusLevel.Warn;
      value = this.formatDateTimePipe.transform(endTime);
    } else {
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

  private getFreeSpace(pool: Pool, volumes: VolumesData): string {
    if (volumes.get(pool.name)?.avail === null) {
      return this.translate.instant('Unknown');
    }

    return buildNormalizedFileSize(volumes.get(pool.name).avail);
  }

  private getTotalDisks(pool: Pool): string {
    if (pool?.topology) {
      return countDisksTotal(pool.topology);
    }

    return this.translate.instant('Unknown');
  }
}
