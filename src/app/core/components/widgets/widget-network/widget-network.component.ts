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
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { TableService } from 'app/pages/common/entity/table/table.service';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';

interface NicInfo {
  ip: string;
  state: string;
  in: string;
  out: string;
  lastSent: number;
  lastReceived: number;
  chartData: ChartData;
  emptyConfig?: EmptyConfig;
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

  readonly emptyTypes = EmptyType;
  private utils: WidgetUtils;
  LinkState = LinkState;
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

  minSizeToActiveTrafficArrowIcon = 1024;

  chartData: ChartData = {};
  interval: Interval;
  availableNics: BaseNetworkInterface[] = [];
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: this.aspectRatio,
    animation: {
      duration: 0,
    },
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
              if (value == 0) {
                return 0;
              }

              const converted = this.utils.convert(value);
              return parseFloat(converted.value).toFixed(1) + converted.units.charAt(0);
            },
          },
        },
      ],
    },
  };

  constructor(
    public router: Router, private ws: WebSocketService,
    private reportsService: ReportsService,
    private tableService: TableService, public translate: TranslateService,
  ) {
    super(translate);
    this.configurable = false;
    this.utils = new WidgetUtils();
  }

  ngOnDestroy(): void {
    this.core.emit({ name: 'StatsRemoveListener', data: { name: 'NIC', obj: this } });
    this.core.unregister({ observerClass: this });

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  ngAfterViewInit(): void {
    this.availableNics = this.nics.filter((nic) => nic.state.link_state === LinkState.Up);

    this.updateGridInfo();
    this.updateMapInfo();
    this.fetchReportData();

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.fetchReportData();
    }, 10000);

    this.stats.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.name.startsWith('NetTraffic_')) {
        const nicName = evt.name.substr('NetTraffic_'.length);
        if (nicName in this.nicInfoMap) {
          const sent = this.utils.convert(evt.data.sent_bytes_rate);
          const received = this.utils.convert(evt.data.received_bytes_rate);

          const nicInfo = this.nicInfoMap[nicName];
          nicInfo.in = received.value + ' ' + received.units + '/s';
          nicInfo.out = sent.value + ' ' + sent.units + '/s';

          if (evt.data.sent_bytes - nicInfo.lastSent > this.minSizeToActiveTrafficArrowIcon) {
            nicInfo.lastSent = evt.data.sent_bytes;
            this.tableService.updateStateInfoIcon(nicName, 'sent');
          }

          if (evt.data.received_bytes - nicInfo.lastReceived > this.minSizeToActiveTrafficArrowIcon) {
            nicInfo.lastReceived = evt.data.received_bytes;
            this.tableService.updateStateInfoIcon(nicName, 'received');
          }
        }
      }
    });
  }

  getColspan(index: number): number {
    let colSpan = 6;
    if (this.availableNics.length <= 3) {
      colSpan = 6;
    } else if (this.availableNics.length == 4) {
      colSpan = 3;
    } else if (this.availableNics.length == 5) {
      if (index < 2) {
        colSpan = 3;
      } else {
        colSpan = 2;
      }
    } else if (this.availableNics.length >= 6) {
      colSpan = 2;
    }
    return colSpan;
  }

  updateMapInfo(): void {
    this.availableNics.forEach((nic: BaseNetworkInterface) => {
      this.nicInfoMap[nic.state.name] = {
        ip: this.getIpAddress(nic),
        state: this.getLinkState(nic),
        in: '',
        out: '',
        lastSent: 0,
        lastReceived: 0,
        chartData: null,
        emptyConfig: {
          type: EmptyType.Loading,
          large: false,
          title: T('Loading'),
        },
      };
    });
  }

  updateGridInfo(): void {
    const nicsCount = this.availableNics.length;
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
    let ip = '–';
    if (nic.state.aliases) {
      const addresses = nic.state.aliases.filter((item: NetworkInterfaceAlias) =>
        [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type));

      if (addresses.length > 0) {
        ip = addresses[0].address + '/' + addresses[0].netmask;

        if (addresses.length >= 2) {
          ip += ` (+${addresses.length - 1})`; /* show that interface has additional addresses */
        }
      }
    }

    return ip;
  }

  getLinkState(nic: BaseNetworkInterface): string {
    if (!nic.state.aliases) { return ''; }
    return nic.state.link_state.replace(/_/g, ' ');
  }

  async fetchReportData(): Promise<void> {
    const endDate = await this.reportsService.getServerTime();
    const subOptions: Duration = {};
    subOptions['hours'] = 1;
    const startDate = sub(endDate, subOptions);

    const timeFrame = {
      start: Math.floor(startDate.getTime() / 1000),
      end: Math.floor(endDate.getTime() / 1000),
    };

    this.availableNics.forEach((nic) => {
      const params = {
        identifier: nic.name,
        name: 'interface',
      };
      this.ws.call('reporting.get_data', [[params], timeFrame]).pipe(untilDestroyed(this)).subscribe((res) => {
        res = res[0];

        const labels: number[] = [];
        for (let i = 0; i <= res.data.length; i++) {
          const label = (res.start + i * res.step) * 1000;
          labels.push(label);
        }

        const chartData = {
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
      },
      () => {
        // Handle the error
        const errorString = this.translate.instant(T('Error getting chart data'));
        this.nicInfoMap[nic.name].emptyConfig = this.chartDataError(errorString);
      });
    });
  }

  chartDataError(err: string): EmptyConfig {
    return {
      type: EmptyType.Errors,
      large: false,
      compact: true,
      title: err,
    };
  }

  getChartBodyClassess(nic: BaseNetworkInterface): string[] {
    const classes = [];

    if (this.nicInfoMap[nic.state.name].emptyConfig.type === this.emptyTypes.Errors) {
      classes.push('chart-body-errors');
    }

    if (
      this.nicInfoMap[nic.state.name].emptyConfig.type === this.emptyTypes.Loading
      && !this.nicInfoMap[nic.name].chartData
    ) {
      classes.push('chart-body-loading');
    }

    return classes;
  }
}
