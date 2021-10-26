import {
  AfterViewInit, Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';

interface ItemInfo {
  icon: string;
  level: string;
  value: string;
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
  selector: 'widget-storage',
  templateUrl: './widget-storage.component.html',
  styleUrls: ['./widget-storage.component.scss'],
})
export class WidgetStorageComponent extends WidgetComponent implements AfterViewInit, OnChanges {
  @Input() pools: Pool[];
  @Input() volumeData: VolumesData;
  title: string = T('Storage');

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
    let level = 'safe';
    let icon = 'mdi-check-circle';
    const value = pool.status == PoolStatus.Online && !pool.healthy ? T('Unhealthy') : pool.status;

    switch (pool.status) {
      case PoolStatus.Healthy:
        break;
      case PoolStatus.Locked:
      case PoolStatus.Unknown:
      case PoolStatus.Offline:
      case PoolStatus.Degraded:
        level = 'warn';
        icon = 'mdi-alert-circle';
        break;
      case PoolStatus.Faulted:
      case PoolStatus.Unavailable:
      case PoolStatus.Removed:
        level = 'error';
        icon = 'mdi-close-circle';
        break;
    }

    return {
      level,
      icon,
      value,
    };
  }

  percentAsNumber(value: string): number {
    const spl = value.split('%');
    return parseInt(spl[0]);
  }

  getUsedSpaceItemInfo(pool: Pool): ItemInfo {
    const volume = this.volumeData[pool.name];
    let level = 'safe';
    let icon = 'mdi-check-circle';
    let value;

    if (!volume || !volume.used_pct) {
      value = this.translate.instant('Unknown');
      level = 'warn';
      icon = 'mdi-alert-circle';
    } else {
      if (this.cols == 1) {
        value = volume.used_pct;
      } else {
        value = this.translate.instant('{used} of {total} ({used_pct})', {
          used: this.getSizeString(volume.used),
          total: this.getSizeString(volume.used + volume.avail),
          used_pct: volume.used_pct,
        });
      }

      if (this.percentAsNumber(volume.used_pct) >= 80) {
        level = 'warn';
        icon = 'mdi-alert-circle';
      } else {
        level = 'safe';
        icon = 'mdi-check-circle';
      }
    }

    return {
      level,
      icon,
      value,
    };
  }

  getDiskWithErrorsItemInfo(pool: Pool): ItemInfo {
    let level = 'warn';
    let icon = 'mdi-alert-circle';
    let value: string = T('Unknown');

    if (pool && pool.topology) {
      const unhealthy: string[] = []; // Disks with errors
      pool.topology.data.forEach((item: VDev) => {
        if (item.type == VDevType.Disk) {
          const diskErrors = item.stats.read_errors + item.stats.write_errors + item.stats.checksum_errors;

          if (diskErrors > 0) {
            unhealthy.push(item.disk);
          }
        } else {
          item.children.forEach((device: VDev) => {
            const diskErrors = device.stats.read_errors + device.stats.write_errors + device.stats.checksum_errors;

            if (diskErrors > 0) {
              unhealthy.push(device.disk);
            }
          });
        }
      });
      if (unhealthy.length == 0) {
        value = '0';
        level = 'safe';
        icon = 'mdi-check-circle';
      } else {
        level = 'warn';
        icon = 'mdi-alert-circle';
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
        if (item.type == VDevType.Disk) {
          total++;
        } else {
          total += item.children.length;
        }
      });
      return total.toString() + ' (data)';
    }

    return T('Unknown');
  }

  getFreeSpace(pool: Pool): string {
    const volume = this.volumeData[pool.name];
    if (volume && volume.used_pct) {
      if (Number.isNaN(volume.used) ? volume.used : filesize(volume.used, { exponent: 3 }) !== 'Locked') {
        return this.getSizeString(volume.avail);
      }
    } else if (!volume || typeof volume.avail == undefined) {
      return T('Unknown');
    } else {
      return T('Gathering data...');
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
