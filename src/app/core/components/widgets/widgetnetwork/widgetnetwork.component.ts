import {
  Component, AfterViewInit, OnDestroy, Input,
} from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { T } from 'app/translate-marker';

interface NetTraffic {
  sent: string;
  sentUnits: string;
  received: string;
  receivedUnits: string;
}

interface Converted {
  value: string;
  units: string;
}

@UntilDestroy()
@Component({
  selector: 'widget-network',
  templateUrl: './widgetnetwork.component.html',
  styleUrls: ['./widgetnetwork.component.scss'],
})
export class WidgetNetworkComponent extends WidgetComponent implements AfterViewInit, OnDestroy {
  @Input() stats: any;
  @Input() nics: any[];
  traffic: NetTraffic;

  title = T('Network');

  padding = 10;
  cols = 2;
  rows = 2;
  gap = 10;
  contentHeight = 400 - 56;
  rowHeight = 150;

  constructor(public router: Router, public translate: TranslateService) {
    super(translate);
    this.configurable = false;
  }

  ngOnDestroy(): void {
    this.core.emit({ name: 'StatsRemoveListener', data: { name: 'NIC', obj: this } });
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.updateGridInfo();
  }

  getColspan(index: number): number {
    let colSpan = 6;
    if (this.nics.length <= 3) {
      colSpan = 6;
    } else if (this.nics.length == 4) {
      colSpan = 3;
    } else if (this.nics.length == 5) {
      if (index < 2) {
        colSpan = 3;
      } else {
        colSpan = 2;
      }
    } else if (this.nics.length >= 6) {
      colSpan = 2;
    }
    return colSpan;
  }

  updateGridInfo(): void {
    const nicsCount = this.nics.length;
    if (nicsCount <= 3) {
      this.rows = nicsCount;
    } else {
      this.rows = 2;
    }

    if (this.rows < 1) {
      this.rows++;
    } else if (this.rows > 3) {
      this.rows = 3;
    }

    this.rowHeight = (this.contentHeight - (this.rows - 1) * this.gap - 2 * this.padding) / this.rows;
  }

  getMbps(arr: number[]): number | string {
    // NOTE: Stat is in bytes so we convert
    // no average
    const result = arr[0] / 1024 / 1024;
    if (result > 999) {
      return result.toFixed(1);
    } if (result < 1000 && result > 99) {
      return result.toFixed(2);
    } if (result > 9 && result < 100) {
      return result.toFixed(3);
    } if (result < 10) {
      return result.toFixed(4);
    }
    return -1;
  }

  convert(value: number): Converted {
    let result: number;
    let units: string;

    // uppercase so we handle bits and bytes...
    switch (this.optimizeUnits(value)) {
      case 'B':
      case 'KB':
        units = T('KiB');
        result = value / 1024;
        break;
      case 'MB':
        units = T('MiB');
        result = value / 1024 / 1024;
        break;
      case 'GB':
        units = T('GiB');
        result = value / 1024 / 1024 / 1024;
        break;
      case 'TB':
        units = T('TiB');
        result = value / 1024 / 1024 / 1024 / 1024;
        break;
      case 'PB':
        units = T('PiB');
        result = value / 1024 / 1024 / 1024 / 1024 / 1024;
        break;
      default:
        units = T('KiB');
        result = 0.00;
    }

    return result ? { value: result.toFixed(2), units } : { value: '0.00', units };
  }

  optimizeUnits(value: number): string {
    let units = 'B';
    if (value > 1024 && value < (1024 * 1024)) {
      units = 'KB';
    } else if (value >= (1024 * 1024) && value < (1024 * 1024 * 1024)) {
      units = 'MB';
    } else if (value >= (1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024)) {
      units = 'GB';
    } else if (value >= (1024 * 1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024 * 1024)) {
      units = 'TB';
    }

    return units;
  }

  manageInterface(_interface: any): void {
    const navigationExtras: NavigationExtras = { state: { editInterface: _interface.name } };
    this.router.navigate(['network'], navigationExtras);
  }
}
