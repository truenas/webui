import {
  Component, AfterViewInit, OnDestroy, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WidgetUtils } from 'app/core/components/widgets/widget-utils';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { TableService } from 'app/pages/common/entity/table/table.service';
import { T } from 'app/translate-marker';

interface NicInfo {
  ip: string;
  state: string;
  in: string;
  out: string;
  lastSent: number;
  lastReceived: number;
}

interface NicInfoMap {
  [name: string]: NicInfo;
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

  private utils: WidgetUtils;
  title = T('Network');
  nicInfoMap: NicInfoMap = {};
  paddingX = 16;
  paddingTop = 16;
  paddingBottom = 16;
  cols = 2;
  rows = 2;
  gap = 16;
  contentHeight = 400 - 56;
  rowHeight = 150;

  constructor(public router: Router, private tableService: TableService, public translate: TranslateService) {
    super(translate);
    this.configurable = false;
    this.utils = new WidgetUtils();
  }

  ngOnDestroy(): void {
    this.core.emit({ name: 'StatsRemoveListener', data: { name: 'NIC', obj: this } });
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.updateGridInfo();
    this.updateMapInfo();

    this.stats.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.name.startsWith('NetTraffic_')) {
        const nicName = evt.name.substr('NetTraffic_'.length);
        if (nicName in this.nicInfoMap) {
          const sent = this.utils.convert(evt.data.sent_bytes_rate);
          const received = this.utils.convert(evt.data.received_bytes_rate);

          const nicInfo = this.nicInfoMap[nicName];
          nicInfo.in = received.value + ' ' + received.units + '/s';
          nicInfo.out = sent.value + ' ' + sent.units + '/s';

          if (evt.data.sent_bytes - nicInfo.lastSent > 1024) {
            nicInfo.lastSent = evt.data.sent_bytes;
            this.tableService.updateStateInfoIcon(nicName, 'sent');
          }

          if (evt.data.received_bytes - nicInfo.lastReceived > 1024) {
            nicInfo.lastReceived = evt.data.received_bytes;
            this.tableService.updateStateInfoIcon(nicName, 'received');
          }
        }
      }
    });
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

  updateMapInfo(): void {
    this.nics.forEach((nic: any) => {
      this.nicInfoMap[nic.state.name] = {
        ip: this.getIpAddress(nic),
        state: this.getLinkState(nic),
        in: '',
        out: '',
        lastSent: 0,
        lastReceived: 0,
      };
    });
  }

  updateGridInfo(): void {
    const nicsCount = this.nics.length;
    if (nicsCount <= 3) {
      this.rows = nicsCount;
      if (nicsCount == 3) {
        this.paddingTop = 0;
        this.paddingBottom = 4;
        this.gap = 8;
      } else {
        this.paddingTop = 16;
        this.paddingBottom = 16;
        this.gap = 16;
      }
    } else {
      this.rows = 2;
      this.paddingTop = 16;
      this.paddingBottom = 16;
      this.gap = 16;
    }

    if (this.rows < 1) {
      this.rows++;
    } else if (this.rows > 3) {
      this.rows = 3;
    }
    const space = (this.rows - 1) * this.gap + this.paddingTop + this.paddingBottom;
    this.rowHeight = (this.contentHeight - space) / this.rows;
  }

  getIpAddress(nic: any): string {
    let ip = '0';
    if (nic.aliases) {
      const filtered = nic.aliases.filter((item: any) =>
        [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type));
      if (filtered.length > 0) {
        ip = filtered[0].address + '/' + filtered[0].netmask;
      }
    }

    return ip;
  }

  getLinkState(nic: any): string {
    if (!nic.state.aliases) { return ''; }
    return nic.state.link_state.replace(/_/g, ' ');
  }
}
