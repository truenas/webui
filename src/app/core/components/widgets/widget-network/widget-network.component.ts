import {
  Component, AfterViewInit, OnDestroy, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { sub } from 'date-fns';
import { WidgetUtils } from 'app/core/components/widgets/widget-utils';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { TableService } from 'app/pages/common/entity/table/table.service';
import { WebSocketService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { T } from 'app/translate-marker';

interface NicInfo {
  ip: string;
  state: string;
  in: string;
  out: string;
  lastSent: number;
  lastReceived: number;
  chartData: ChartData;
}

interface NicInfoMap {
  [name: string]: NicInfo;
}

@UntilDestroy()
@Component({
  selector: 'widget-network',
  templateUrl: './widget-network.component.html',
  styleUrls: ['./widget-network.component.scss'],
})
export class WidgetNetworkComponent extends WidgetComponent implements AfterViewInit, OnDestroy {
  @Input() stats: any;
  @Input() nics: BaseNetworkInterface[];

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
  aspectRatio = 474 / 200;

  chartData: ChartData = {};

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: this.aspectRatio,
    layout: {
      padding: 0,
    },
    legend: {
      align: 'end',
      labels: {
        boxWidth: 8,
        usePointStyle: true,
      },
    },
    scales: {
      xAxes: [
        {
          type: 'time',
          time: {
            unit: 'minute',
            displayFormats: {
              minute: 'HH:mm',
            },
          },
          ticks: {
            beginAtZero: true,
            maxTicksLimit: 3,
            maxRotation: 0,
          },
        },
      ],
      yAxes: [
        {
          position: 'right',
          ticks: {
            maxTicksLimit: 8,
            callback: (value) => {
              return this.convertKMGT(value);
            },
          },
        },
      ],
    },
  };

  constructor(
    public router: Router, private ws: WebSocketService, private locale: LocaleService,
    private tableService: TableService, public translate: TranslateService,
  ) {
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

    this.nics.forEach((nic) => {
      this.fetchReportData(nic);
    });

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
    this.nics.forEach((nic: BaseNetworkInterface) => {
      this.nicInfoMap[nic.state.name] = {
        ip: this.getIpAddress(nic),
        state: this.getLinkState(nic),
        in: '',
        out: '',
        lastSent: 0,
        lastReceived: 0,
        chartData: null,
      };
    });
  }

  updateGridInfo(): void {
    const nicsCount = this.nics.length;
    let maxTicksLimit = 5;

    if (nicsCount <= 3) {
      this.rows = nicsCount;
      if (nicsCount == 3) {
        this.paddingTop = 0;
        this.paddingBottom = 4;
        this.gap = 8;
        this.aspectRatio = 336 / 100;
        maxTicksLimit = 3;
      } else {
        this.paddingTop = 16;
        this.paddingBottom = 16;
        this.gap = 16;

        if (nicsCount == 2) {
          this.aspectRatio = 304 / 124;
          maxTicksLimit = 3;
        } else {
          this.aspectRatio = 474 / 200;
        }
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

    const newChartOptions = { ...this.chartOptions };
    newChartOptions.scales.yAxes[0].ticks.maxTicksLimit = maxTicksLimit;
    newChartOptions.aspectRatio = this.aspectRatio;
    this.chartOptions = newChartOptions;
  }

  getIpAddress(nic: BaseNetworkInterface): string {
    let ip = T('Unknown');
    if (nic.aliases) {
      const filtered = nic.aliases.filter((item: NetworkInterfaceAlias) =>
        [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type));
      if (filtered.length > 0) {
        ip = filtered[0].address + '/' + filtered[0].netmask;
      }
    }

    return ip;
  }

  getLinkState(nic: BaseNetworkInterface): string {
    if (!nic.state.aliases) { return ''; }
    return nic.state.link_state.replace(/_/g, ' ');
  }

  getServerTime(): Date {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open('HEAD', window.location.origin.toString(), false);
    xmlHttp.setRequestHeader('Content-Type', 'text/html');
    xmlHttp.send('');
    const serverTime = xmlHttp.getResponseHeader('Date');
    const seconds = new Date(serverTime).getTime();
    const secondsToTrim = 60;
    const trimmed = new Date(seconds - (secondsToTrim * 1000));
    return trimmed;
  }

  fetchReportData(nic: BaseNetworkInterface): void {
    const params = {
      identifier: nic.name,
      name: 'interface',
    };

    const endDate = this.getServerTime();
    const subOptions: Duration = {};
    subOptions['hours'] = 2;
    const startDate = sub(endDate, subOptions);

    const timeFrame = {
      start: Math.floor(startDate.getTime() / 1000),
      end: Math.floor(endDate.getTime() / 1000),
    };

    this.ws.call('reporting.get_data', [[params], timeFrame]).pipe(untilDestroyed(this)).subscribe((res) => {
      res = res[0];

      const labels: number[] = [];
      for (let i = 0; i <= res.data.length; i++) {
        const label = (res.start + i * res.step) * 1000;
        labels.push(label);
      }

      const chartData = {
        // labels,
        datasets: [
          {
            label: nic.name + '(in)',
            data: res.data.map((item: number[], index: number) => ({ t: labels[index], y: item[0] })),
            borderColor: this.themeService.currentTheme().blue,
            backgroundColor: this.themeService.currentTheme().blue,
            pointRadius: 0.2,
          },
          {
            label: nic.name + '(out)',
            data: res.data.map((item: number[], index: number) => ({ t: labels[index], y: -item[1] })),
            borderColor: this.themeService.currentTheme().orange,
            backgroundColor: this.themeService.currentTheme().orange,
            pointRadius: 0.1,
          },
        ],
      };

      this.nicInfoMap[nic.name].chartData = chartData;
    });
  }

  convertKMGT(value: number): string {
    const kilo = 1024;
    const mega = kilo * 1024;
    const giga = mega * 1024;
    const tera = giga * 1024;

    let unit = '';
    let output = 0;

    const absValue = Math.abs(value);
    if (absValue > tera) {
      unit = 'T';
      output = value / tera;
    } else if (absValue < tera && absValue > giga) {
      unit = 'G';
      output = value / giga;
    } else if (absValue < giga && absValue > mega) {
      unit = 'M';
      output = value / mega;
    } else if (absValue < mega && absValue > kilo) {
      unit = 'K';
      output = value / kilo;
    }

    return output.toFixed(1) + unit;
  }
}
