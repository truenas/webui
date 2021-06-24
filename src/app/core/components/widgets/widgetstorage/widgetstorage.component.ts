import {
  Component, OnDestroy, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { T } from 'app/translate-marker';

interface ItemInfo {
  icon: string;
  level: string;
  value: string;
}

interface PoolInfo {
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
  templateUrl: './widgetstorage.component.html',
  styleUrls: ['./widgetstorage.component.scss'],
})
export class WidgetStorageComponent extends WidgetComponent implements OnDestroy, OnChanges {
  @Input() pools: Pool[];
  @Input() volumeData: any;
  title: string = T('Storage');

  poolInfoMap: PoolInfoMap = {};
  padding = 7;
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

  updateGridInfo(): void {
    const poolCount = this.pools.length;
    if (poolCount <= 2) {
      this.cols = 1;
      this.padding = 15;
      this.gap = 15;
    } else if (poolCount <= 4) {
      this.cols = 2;
      this.padding = 10;
      this.gap = 10;
    } else {
      this.cols = 2;
      this.padding = 7;
      this.gap = 7;
    }

    this.rows = Math.round(poolCount / this.cols);
    if (this.rows == 1) {
      this.rows++;
    }
    this.rowHeight = (this.contentHeight - (this.rows - 1) * this.gap - 2 * this.padding) / this.rows;
  }

  updatePoolInfoMap(): void {
    this.pools.forEach((pool) => {
      this.poolInfoMap[pool.name] = {
        status: this.getStatusItemInfo(pool),
        usedSpace: this.getUsedSpaceItemInfo(pool),
        disksWithError: this.getDiskWithErrorsItemInfo(pool),
      };
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  getStatusItemInfo(pool: Pool): ItemInfo {
    let level = 'safe';
    let icon = 'mdi-check-circle';
    const value = pool.status == 'ONLINE' && !pool.healthy ? T('Unhealthy') : pool.status;

    switch (pool.status as string) {
      // TODO: Unexpected statuses, possibly introduced on frontend
      case 'HEALTHY':
        break;
      case 'LOCKED':
      case 'UNKNOWN':
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
    const vol = this.volumeData[pool.name];
    let level = 'safe';
    let icon = 'mdi-check-circle';
    let value;

    if (!vol || !vol.used_pct) {
      value = T('Unknown');
      level = 'warn';
      icon = 'mdi-alert-circle';
    } else {
      value = vol.used_pct;
      if (this.percentAsNumber(vol.used_pct) >= 80) {
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
    let value = T('Unknown');

    if (pool && pool.topology) {
      const unhealthy: any[] = []; // Disks with errors
      pool.topology.data.forEach((item: any) => {
        if (item.type == VDevType.Disk) {
          const diskErrors = item.read_errors + item.write_errors + item.checksum_errors;

          if (diskErrors > 0) {
            unhealthy.push(item.disk);
          }
        } else {
          item.children.forEach((device: any) => {
            const diskErrors = device.read_errors + device.write_errors + device.checksum_errors;

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
        value = unhealthy.length + T(' Disks');
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
      return total.toString() + T(' (data)');
    }

    return T('Unknown');
  }

  getFreeSpace(pool: Pool): string {
    let displayValue = '';

    const vol = this.volumeData[pool.name];
    if (vol && vol.used_pct) {
      let usedValue;
      if (isNaN(vol.used)) {
        usedValue = vol.used;
      } else {
        usedValue = filesize(vol.used, { exponent: 3 });
      }

      if (usedValue != 'Locked') {
        // this.core.emit({ name: 'PoolDisksRequest', data: [pool.id] });
        let unit;
        let size;
        displayValue = filesize(vol.avail, { standard: 'iec' });
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
        displayValue = size + ' ' + unit;
      }
    } else if (!vol || typeof vol.avail == undefined) {
      displayValue = T('Unknown');
    } else {
      displayValue = T('Gathering data...');
    }

    return displayValue;
  }
}
