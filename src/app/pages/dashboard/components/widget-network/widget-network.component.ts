import {
  Component, AfterViewInit, OnDestroy, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { sub } from 'date-fns';
import { lastValueFrom, Subject } from 'rxjs';
import {
  filter, map, take, throttleTime,
} from 'rxjs/operators';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { ReportingParams } from 'app/interfaces/reporting.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';
import { ReportingDatabaseError, ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { StorageService, WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

interface NicInfo {
  ip: string;
  state: LinkState;
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
  selector: 'ix-widget-network',
  templateUrl: './widget-network.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-network.component.scss',
  ],
})
export class WidgetNetworkComponent extends WidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() stats: Subject<CoreEvent>;
  @Input() nics: BaseNetworkInterface[];

  readonly emptyTypes = EmptyType;
  private utils: WidgetUtils;
  LinkState = LinkState;
  title = this.translate.instant('Network');
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
  dateFormat = this.localeService.getPreferredDateFormatForChart();
  timeFormat = this.localeService.getPreferredTimeFormatForChart();

  minSizeToActiveTrafficArrowIcon = 1024;

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
            tooltipFormat: `${this.dateFormat} ${this.timeFormat}`,
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
              if (value === 0) {
                return 0;
              }

              const converted = this.utils.convert(value as number);
              return parseFloat(converted.value).toFixed(1) + converted.units.charAt(0);
            },
          },
        },
      ],
    },
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          let label = data.datasets[tooltipItem.datasetIndex].label || '';
          if (label) {
            label += ': ';
          }
          if (tooltipItem.yLabel === 0) {
            label += 0;
          } else {
            const converted = this.utils.convert(Number(tooltipItem.yLabel));
            label += parseFloat(converted.value).toFixed(1) + converted.units.charAt(0);
          }
          return label;
        },
      },
    },
  };

  loadingEmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading'),
  };

  constructor(
    private ws: WebSocketService,
    private reportsService: ReportsService,
    private tableService: TableService,
    public translate: TranslateService,
    private dialog: DialogService,
    private storage: StorageService,
    private localeService: LocaleService,
    public themeService: ThemeService,
  ) {
    super(translate);
    this.configurable = false;
    this.utils = new WidgetUtils();
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  ngOnInit(): void {
    this.availableNics = this.nics.filter((nic) => nic.state.link_state !== LinkState.Down);

    this.updateGridInfo();
    this.updateMapInfo();
    this.fetchReportData();

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  ngAfterViewInit(): void {
    this.interval = setInterval(() => {
      this.fetchReportData();
    }, 10000);

    this.stats.pipe(
      filter((evt) => evt.name.startsWith('NetTraffic_')),
      filter((evt) => {
        const [, nicName] = evt.name.split('_');
        return this.availableNics.findIndex((nic) => nic.name === nicName) !== -1;
      }),
      throttleTime(500),
      untilDestroyed(this),
    ).subscribe((evt: CoreEvent) => {
      const [, nicName] = evt.name.split('_');
      if (nicName in this.nicInfoMap) {
        const sent = this.utils.convert(evt.data.sent_bytes_rate);
        const received = this.utils.convert(evt.data.received_bytes_rate);

        const nicInfo = this.nicInfoMap[nicName];
        if (evt.data.link_state) {
          nicInfo.state = evt.data.link_state as LinkState;
        }
        nicInfo.in = `${received.value} ${received.units}/s`;
        nicInfo.out = `${sent.value} ${sent.units}/s`;

        if (
          evt.data.sent_bytes !== undefined
          && evt.data.sent_bytes - nicInfo.lastSent > this.minSizeToActiveTrafficArrowIcon
        ) {
          nicInfo.lastSent = evt.data.sent_bytes;
          this.tableService.updateStateInfoIcon(nicName, 'sent');
        }

        if (
          evt.data.received_bytes !== undefined
          && evt.data.received_bytes - nicInfo.lastReceived > this.minSizeToActiveTrafficArrowIcon
        ) {
          nicInfo.lastReceived = evt.data.received_bytes;
          this.tableService.updateStateInfoIcon(nicName, 'received');
        }
      }
    });
  }

  getColspan(index: number): number {
    let colSpan = 6;
    if (this.availableNics.length <= 3) {
      colSpan = 6;
    } else if (this.availableNics.length === 4) {
      colSpan = 3;
    } else if (this.availableNics.length === 5) {
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
        emptyConfig: this.loadingEmptyConfig,
      };
    });
  }

  updateGridInfo(): void {
    const nicsCount = this.availableNics.length;
    let maxTicksLimit = 5;
    this.paddingTop = 16;
    this.paddingBottom = 16;

    if (nicsCount <= 3) {
      this.rows = nicsCount;
      if (nicsCount === 3) {
        this.gap = 4;
        this.aspectRatio = 304 / 100;
        maxTicksLimit = 3;
      } else {
        this.gap = 8;
        this.aspectRatio = 474 / 188;

        if (nicsCount === 2) {
          this.gap = 16;
          this.aspectRatio = 304 / 148;
          maxTicksLimit = 3;
        }
      }
    } else {
      this.rows = 2;
      this.gap = 8;
      if (nicsCount === 4) {
        this.gap = 16;
      }
      if (nicsCount >= 5) {
        this.paddingTop = 0;
      }
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
      const addresses = nic.state.aliases.filter((item: NetworkInterfaceAlias) => {
        return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type);
      });

      if (addresses.length > 0) {
        ip = `${addresses[0].address}/${addresses[0].netmask}`;

        if (addresses.length >= 2) {
          ip += ` (+${addresses.length - 1})`; /* show that interface has additional addresses */
        }
      }
    }

    return ip;
  }

  getLinkState(nic: BaseNetworkInterface): LinkState {
    if (nic.state.name in this.nicInfoMap) {
      return this.nicInfoMap[nic.state.name].state || LinkState.Down;
    }

    return nic.state.link_state;
  }

  getLinkStateLabel(nic: BaseNetworkInterface): string {
    return this.getLinkState(nic).replace(/_/g, ' ');
  }

  async fetchReportData(): Promise<void> {
    const endDate = await lastValueFrom(this.reportsService.getServerTime());
    const subOptions: Duration = {};
    subOptions['hours'] = 1;
    const startDate = sub(endDate, subOptions);

    const timeFrame = {
      start: Math.floor(startDate.getTime() / 1000),
      end: Math.floor(endDate.getTime() / 1000),
    };

    this.availableNics.forEach((nic) => {
      const networkInterfaceName = nic.state.name;
      const params = {
        identifier: networkInterfaceName,
        name: 'interface',
      } as ReportingParams;
      this.ws.call('reporting.get_data', [[params], timeFrame]).pipe(
        map((response) => response[0]),
        untilDestroyed(this),
      ).subscribe({
        next: (response) => {
          const labels: number[] = response.data.map((_, index) => {
            return (response.start + index * response.step) * 1000;
          });

          const chartData = {
            datasets: [
              {
                label: `incoming [${networkInterfaceName}]`,
                data: response.data.map((item: number[], index: number) => ({ t: labels[index], y: item[0] })),
                borderColor: this.themeService.currentTheme().blue,
                backgroundColor: this.themeService.currentTheme().blue,
                pointRadius: 0.2,
              },
              {
                label: `outcoming [${networkInterfaceName}]`,
                data: response.data.map((item: number[], index: number) => ({ t: labels[index], y: -item[1] })),
                borderColor: this.themeService.currentTheme().orange,
                backgroundColor: this.themeService.currentTheme().orange,
                pointRadius: 0.1,
              },
            ],
          };

          this.nicInfoMap[networkInterfaceName].chartData = chartData;
        },
        error: (err: WebsocketError) => {
          this.nicInfoMap[networkInterfaceName].emptyConfig = this.chartDataError(err, nic);
        },
      });
    });
  }

  chartDataError(err: WebsocketError, nic: BaseNetworkInterface): EmptyConfig {
    if (err.error === ReportingDatabaseError.InvalidTimestamp) {
      const errorMessage = err.reason ? err.reason.replace('[EINVALIDRRDTIMESTAMP] ', '') : null;
      const helpMessage = this.translate.instant('You can clear reporting database and start data collection immediately.');
      return {
        type: EmptyType.Errors,
        large: false,
        compact: false,
        title: this.translate.instant('The reporting database is broken'),
        button: {
          label: this.translate.instant('Fix database'),
          action: () => {
            this.dialog.confirm({
              title: this.translate.instant('The reporting database is broken'),
              message: `${errorMessage}<br/>${helpMessage}`,
              buttonMsg: this.translate.instant('Clear'),
            }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.nicInfoMap[nic.state.name].emptyConfig = this.loadingEmptyConfig;
              this.ws.call('reporting.clear').pipe(take(1), untilDestroyed(this)).subscribe();
            });
          },
        },
      };
    }

    return {
      type: EmptyType.Errors,
      large: false,
      compact: true,
      title: this.translate.instant('Error getting chart data'),
    };
  }

  getChartBodyClassess(nic: BaseNetworkInterface): string[] {
    const classes = [];

    if (this.nicInfoMap[nic.state.name].emptyConfig.type === this.emptyTypes.Errors) {
      classes.push('chart-body-errors');
    }

    if (
      this.nicInfoMap[nic.state.name].emptyConfig.type === this.emptyTypes.Loading
      && !this.nicInfoMap[nic.state.name].chartData
    ) {
      classes.push('chart-body-loading');
    }

    return classes;
  }

  showInOutInfo(nic: BaseNetworkInterface): string {
    const lastSent = this.storage.convertBytesToHumanReadable(this.nicInfoMap[nic.state.name].lastSent);
    const lastReceived = this.storage.convertBytesToHumanReadable(this.nicInfoMap[nic.state.name].lastReceived);

    return `${this.translate.instant('Sent')}: ${lastSent} ${this.translate.instant('Received')}: ${lastReceived}`;
  }

  getIpAddressTooltip(nic: BaseNetworkInterface): string {
    return `${this.translate.instant('IP Address')}: ${this.getIpAddress(nic)}`;
  }
}
