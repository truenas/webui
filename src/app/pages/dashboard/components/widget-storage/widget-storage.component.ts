import {
  AfterViewInit, Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';

interface ItemInfo {
  icon: StatusIcon;
  level: StatusLevel;
  value: string;
}

enum StatusLevel {
  Safe = 'safe',
  Warn = 'warn',
  Error = 'error',
}

enum StatusIcon {
  Error = 'error',
  CheckCircle = 'check_circle',
  MdiAlert = 'mdi-alert',
  MdiCloseCircle = 'mdi-close-circle',
}

interface PoolInfo {
  freeSpace: string;
  totalDisks: string;
  status: ItemInfo;
  usedSpace: ItemInfo;
  disksWithError: ItemInfo;
}

interface PoolInfoMap {
  [poolName: string]: PoolInfo;
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-storage',
  templateUrl: './widget-storage.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-storage.component.scss',
  ],
})
export class WidgetStorageComponent extends WidgetComponent implements AfterViewInit, OnChanges {
  @Input() pools: Pool[];
  @Input() volumeData: VolumesData;

  title: string = this.translate.instant('Storage');
  poolInfoMap: PoolInfoMap = {};
  paddingTop = 7;
  paddingLeft = 7;
  paddingRight = 7;
  paddingBottom = 7;
  cols = 2;
  rows = 2;
  gap = 7;
  contentHeight = 400 - 56;
  rowHeight = 150;

  constructor(public router: Router, public translate: TranslateService) {
    super(translate);
    this.configurable = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.pools || changes.volumeData) {
      this.updateGridInfo();
      this.updatePoolInfoMap();
    }
  }

  ngAfterViewInit(): void {
    this.updateGridInfo();
    this.updatePoolInfoMap();
  }

  updateGridInfo(): void {
    const poolCount = this.pools.length;
    this.paddingTop = 16;
    this.paddingRight = 16;
    this.paddingBottom = 16;
    this.paddingLeft = 16;

    if (poolCount <= 2) {
      this.cols = 1;
      this.gap = 16;
    } else if (poolCount <= 4) {
      this.cols = 2;
      this.gap = 16;
    } else {
      this.cols = 2;
      this.gap = 8;
      this.paddingTop = 0;
    }

    this.rows = Math.round(poolCount / this.cols);
    if (this.rows <= 1) {
      this.rows++;
    } else if (this.rows > 3) {
      this.rows = 3;
    }

    const space = (this.rows - 1) * this.gap + this.paddingTop + this.paddingBottom;
    this.rowHeight = (this.contentHeight - space) / this.rows;
  }

  updatePoolInfoMap(): void {
    this.pools.forEach((pool) => {
      this.poolInfoMap[pool.name] = {
        totalDisks: this.totalDisks(pool),
        status: this.getStatusItemInfo(pool),
        freeSpace: this.getFreeSpace(pool),
        usedSpace: this.getUsedSpaceItemInfo(pool),
        disksWithError: this.getDiskWithErrorsItemInfo(pool),
      };
    });
  }

  getStatusItemInfo(pool: Pool): ItemInfo {
    let level = StatusLevel.Safe;
    let icon = StatusIcon.CheckCircle;
    let value = pool.status;

    switch (pool.status) {
      case PoolStatus.Online:
        if (!pool.healthy) {
          level = StatusLevel.Warn;
          icon = StatusIcon.MdiAlert;
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
        icon = StatusIcon.Error;
        break;

      case PoolStatus.Faulted:
      case PoolStatus.Unavailable:
      case PoolStatus.Removed:
        level = StatusLevel.Error;
        icon = StatusIcon.MdiCloseCircle;
        break;
    }

    return {
      level,
      icon,
      value,
    };
  }

  convertPercentToNumber(value: string): number {
    const spl = value.split('%');
    return parseInt(spl[0]);
  }

  getUsedSpaceItemInfo(pool: Pool): ItemInfo {
    const volume = this.volumeData[pool.name];
    let level = StatusLevel.Safe;
    let icon = StatusIcon.CheckCircle;
    let value;

    if (!volume || !volume.used_pct) {
      value = this.translate.instant('Unknown');
      level = StatusLevel.Warn;
      icon = StatusIcon.Error;
    } else {
      if (this.cols === 1) {
        value = volume.used_pct;
      } else {
        value = this.translate.instant('{used} of {total} ({used_pct})', {
          used: this.getSizeString(volume.used),
          total: this.getSizeString(volume.used + volume.avail),
          used_pct: volume.used_pct,
        });
      }

      if (this.convertPercentToNumber(volume.used_pct) >= 90) {
        level = StatusLevel.Error;
        icon = StatusIcon.Error;
      } else if (this.convertPercentToNumber(volume.used_pct) >= 80) {
        level = StatusLevel.Warn;
        icon = StatusIcon.Error;
      }
    }

    return {
      level,
      icon,
      value,
    };
  }

  getDiskWithErrorsItemInfo(pool: Pool): ItemInfo {
    let level = StatusLevel.Warn;
    let icon = StatusIcon.Error;
    let value: string = this.translate.instant('Unknown');

    if (pool && pool.topology) {
      const unhealthy: string[] = []; // Disks with errors
      pool.topology.data.forEach((item: TopologyItem) => {
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
        icon = StatusIcon.CheckCircle;
      } else {
        level = StatusLevel.Warn;
        icon = StatusIcon.Error;
        value = unhealthy.length.toString();
      }

      if (this.cols > 1) {
        value += ' of ' + this.totalDisks(pool);
      }
    }

    return {
      level,
      icon,
      value,
    };
  }

  totalDisks(pool: Pool): string {
    if (pool && pool.topology) {
      let total = 0;
      pool.topology.data.forEach((item) => {
        if (item.type === TopologyItemType.Disk) {
          total++;
        } else {
          total += item.children.length;
        }
      });
      return total.toString() + ' (data)';
    }

    return this.translate.instant('Unknown');
  }

  getFreeSpace(pool: Pool): string {
    const volume = this.volumeData[pool.name];
    if (volume && volume.used_pct) {
      if (Number.isNaN(volume.used) ? volume.used : filesize(volume.used, { exponent: 3 }) !== 'Locked') {
        return this.getSizeString(volume.avail);
      }
    } else if (!volume || typeof volume.avail === undefined) {
      return this.translate.instant('Unknown');
    } else {
      return this.translate.instant('Gathering data...');
    }
  }

  getSizeString(volumeSize: number): string {
    let unit;
    let size;
    let displayValue = filesize(volumeSize, { standard: 'iec' });
    if (displayValue.slice(-2) === ' B') {
      unit = displayValue.slice(-1);
      size = new Intl.NumberFormat().format(parseFloat(displayValue.slice(0, -2)));
    } else {
      unit = displayValue.slice(-3);
      size = new Intl.NumberFormat().format(parseFloat(displayValue.slice(0, -4)));
    }
    // Adds a zero to numbers with one (and only one) digit after the decimal
    if (size.charAt(size.length - 2) === '.' || size.charAt(size.length - 2) === ',') {
      size = size.concat('0');
    }
    displayValue = `${size} ${unit}`;

    return displayValue;
  }
}
