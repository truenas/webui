import {
  Component, AfterViewInit, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { sub } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import filesize from 'filesize';
import { Subscription, timer } from 'rxjs';
import {
  filter, map, take, throttleTime,
} from 'rxjs/operators';
import { KiB } from 'app/constants/bytes.constant';
import { EmptyType } from 'app/enums/empty-type.enum';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { NetworkInterfaceUpdate, ReportingDatabaseError, ReportingNameAndId } from 'app/interfaces/reporting.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { TableService } from 'app/modules/entity/table/table.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { deepCloneState } from 'app/pages/dashboard/utils/deep-clone-state.helper';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

interface NicInfo {
  ip: string;
  state: LinkState;
  in: number;
  out: number;
  lastSent: number;
  lastReceived: number;
  chartData: ChartData<'line'>;
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
export class WidgetNetworkComponent extends WidgetComponent implements OnInit, AfterViewInit {
  readonly emptyTypes = EmptyType;
  protected readonly LinkState = LinkState;

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
  timezone: string;

  minSizeToActiveTrafficArrowIcon = 1024;

  fetchDataIntervalSubscription: Subscription;

  availableNics: BaseNetworkInterface[] = [];
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: this.aspectRatio,
    animation: {
      duration: 0,
    },
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        align: 'end',
        labels: {
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (tooltipItem.parsed.y === 0) {
              label += 0;
            } else {
              label = this.getSpeedLabel(Number(tooltipItem.parsed.y));
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm',
          },
          tooltipFormat: `${this.localeService.dateFormat} ${this.localeService.timeFormat}`,
        },
        ticks: {
          maxTicksLimit: 3,
          maxRotation: 0,
        },
      },
      y: {
        position: 'right',
        ticks: {
          maxTicksLimit: 8,
          callback: (value) => {
            if (value === 0) {
              return 0;
            }
            return this.getSpeedLabel(value as number, true);
          },
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
    private formatter: IxFormatterService,
    private localeService: LocaleService,
    public themeService: ThemeService,
    private store$: Store<AppState>,
    private resourcesUsageStore$: ResourcesUsageStore,
  ) {
    super(translate);

    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
    });
  }

  ngOnInit(): void {
    this.resourcesUsageStore$.nics$.pipe(
      deepCloneState(),
      untilDestroyed(this),
    ).subscribe({
      next: (interfaces) => {
        this.availableNics = interfaces.filter((nic) => nic.state.link_state !== LinkState.Down);
        this.updateMapInfo();
      },
    });

    this.updateGridInfo();
  }

  ngAfterViewInit(): void {
    if (!this.fetchDataIntervalSubscription || this.fetchDataIntervalSubscription.closed) {
      this.fetchDataIntervalSubscription = timer(0, 10000).pipe(
        untilDestroyed(this),
      ).subscribe(() => {
        this.fetchReportData();
      });
    }

    this.availableNics.forEach((nic) => {
      this.resourcesUsageStore$.interfacesUsage$.pipe(
        deepCloneState(),
        map((usageUpdate) => usageUpdate[nic.name]),
        filter(Boolean),
        throttleTime(500),
        untilDestroyed(this),
      ).subscribe((usageUpdate: NetworkInterfaceUpdate) => {
        const nicName = nic.name;
        if (nicName in this.nicInfoMap) {
          const nicInfo = this.nicInfoMap[nicName];
          if (usageUpdate.link_state) {
            nicInfo.state = usageUpdate.link_state;
          }
          nicInfo.in = usageUpdate.received_bytes_rate * KiB;
          nicInfo.out = usageUpdate.sent_bytes_rate * KiB;

          if (
            usageUpdate.sent_bytes !== undefined
            && usageUpdate.sent_bytes - nicInfo.lastSent > this.minSizeToActiveTrafficArrowIcon
          ) {
            nicInfo.lastSent = usageUpdate.sent_bytes;
            this.tableService.updateStateInfoIcon(nicName, 'sent');
          }

          if (
            usageUpdate.received_bytes !== undefined
            && usageUpdate.received_bytes - nicInfo.lastReceived > this.minSizeToActiveTrafficArrowIcon
          ) {
            nicInfo.lastReceived = usageUpdate.received_bytes;
            this.tableService.updateStateInfoIcon(nicName, 'received');
          }
        }
      });
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
        in: 0,
        out: 0,
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
    newChartOptions.scales.y.ticks.maxTicksLimit = maxTicksLimit;
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

  fetchReportData(): void {
    const endDate = this.reportsService.serverTime;
    const subOptions: Duration = {};
    subOptions.hours = 1;
    const startDate = sub(endDate, subOptions);

    const timeFrame = {
      start: Math.floor(startDate.getTime() / 1000),
      end: Math.floor(endDate.getTime() / 1000),
    };

    this.availableNics.forEach((nic) => {
      const networkInterfaceName = nic.state.name;
      const params: ReportingNameAndId = {
        identifier: networkInterfaceName,
        name: 'interface',
      };
      this.ws.call('reporting.netdata_get_data', [[params], timeFrame]).pipe(
        map((response) => {
          const updatedResponse = response[0];
          if (this.timezone) {
            updatedResponse.start = utcToZonedTime(updatedResponse.start * 1000, this.timezone).valueOf() / 1000;
            updatedResponse.end = utcToZonedTime(updatedResponse.end * 1000, this.timezone).valueOf() / 1000;
          }
          (updatedResponse.data as number[][]).forEach((row, index) => {
            // remove first column and convert kilobits/s to bytes
            (updatedResponse.data as number[][])[index] = row.slice(1).map((value) => value * KiB);
          });
          return updatedResponse;
        }),
        untilDestroyed(this),
      ).subscribe({
        next: (response) => {
          const labels: number[] = (response.data as number[][]).map((_, index) => {
            return (response.start + index) * 1000;
          });

          const chartData: ChartData<'line'> = {
            datasets: [
              {
                label: `incoming [${networkInterfaceName}]`,
                data: (response.data as number[][]).map((item, index) => ({ x: labels[index], y: item[0] })),
                borderColor: this.themeService.currentTheme().blue,
                backgroundColor: this.themeService.currentTheme().blue,
                pointBackgroundColor: this.themeService.currentTheme().blue,
                pointRadius: 0,
                tension: 0.2,
                fill: true,
              },
              {
                label: `outgoing [${networkInterfaceName}]`,
                data: (response.data as number[][]).map((item, index) => ({ x: labels[index], y: -item[1] })),
                borderColor: this.themeService.currentTheme().orange,
                backgroundColor: this.themeService.currentTheme().orange,
                pointBackgroundColor: this.themeService.currentTheme().orange,
                pointRadius: 0,
                tension: 0.2,
                fill: true,
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
              buttonText: this.translate.instant('Clear'),
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

  getChartBodyClasses(nic: BaseNetworkInterface): string[] {
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
    const lastSent = this.formatter.convertBytesToHumanReadable(this.nicInfoMap[nic.state.name].lastSent);
    const lastReceived = this.formatter.convertBytesToHumanReadable(this.nicInfoMap[nic.state.name].lastReceived);

    return `${this.translate.instant('Sent')}: ${lastSent} ${this.translate.instant('Received')}: ${lastReceived}`;
  }

  getIpAddressTooltip(nic: BaseNetworkInterface): string {
    return `${this.translate.instant('IP Address')}: ${this.getIpAddress(nic)}`;
  }

  private getSpeedLabel(value: number, axis = false): string {
    const converted = filesize(Math.abs(value), { output: 'object', standard: axis ? 'jedec' : 'iec' });
    return `${this.splitValue(converted.value)}${converted.unit}/s`;
  }

  private splitValue(value: number): number {
    if (value < 1024) {
      return Number(value.toString().slice(0, 4));
    }
    return Math.round(value);
  }
}
