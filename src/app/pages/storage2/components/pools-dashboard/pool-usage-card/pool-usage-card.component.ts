import {
  Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { isTopologyDisk } from 'app/interfaces/storage.interface';

export enum UsageHealthLevel {
  Warn = 'warn',
  Error = 'error',
  Safe = 'safe',
}

const maxPct = 80;

@UntilDestroy()
@Component({
  selector: 'ix-pool-usage-card',
  templateUrl: './pool-usage-card.component.html',
  styleUrls: ['./pool-usage-card.component.scss'],
})
export class PoolUsageCardComponent {
  @Input() poolState: Pool;
  @Input() rootDataset: Dataset;

  readonly usageHealthLevel = UsageHealthLevel;

  get isLowCapacity(): boolean {
    return this.usedPercentage >= maxPct;
  }

  get allDiskNames(): string[] {
    if (!this.poolState || !this.poolState.topology) {
      return [];
    }

    const allDiskNames: string[] = [];
    (['cache', 'data', 'dedup', 'log', 'spare', 'special'] as PoolTopologyCategory[]).forEach((categoryName) => {
      const category = this.poolState.topology[categoryName];

      if (!category || !category.length) {
        return;
      }

      category.forEach((item) => {
        if (isTopologyDisk(item) && item.disk) {
          allDiskNames.push(item.disk);
        } else {
          item.children.forEach((device) => {
            if (!device.disk) {
              return;
            }

            allDiskNames.push(device.disk);
          });
        }
      });
    });

    return allDiskNames;
  }

  get capacity(): number {
    return this.rootDataset.available.parsed + this.rootDataset.used.parsed;
  }

  get usedPercentage(): number {
    return this.rootDataset.used.parsed / this.capacity * 100;
  }

  get health(): UsageHealthLevel {
    const isError = this.isStatusError(this.poolState);
    const isWarning = this.isStatusWarning(this.poolState);

    if (isError) {
      return UsageHealthLevel.Error;
    }
    if (isWarning || !this.poolState.healthy || this.isLowCapacity) {
      return UsageHealthLevel.Warn;
    }

    return UsageHealthLevel.Safe;
  }

  private isStatusError(poolState: Pool): boolean {
    return [
      PoolStatus.Faulted,
      PoolStatus.Unavailable,
      PoolStatus.Removed,
    ].includes(poolState.status);
  }

  private isStatusWarning(poolState: Pool): boolean {
    return [
      PoolStatus.Locked,
      PoolStatus.Unknown,
      PoolStatus.Offline,
      PoolStatus.Degraded,
    ].includes(poolState.status);
  }
}
