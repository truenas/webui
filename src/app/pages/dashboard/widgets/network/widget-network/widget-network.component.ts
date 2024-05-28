import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import {
  filter, map,
  switchMap,
} from 'rxjs';
import { kb } from 'app/constants/bits.constant';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { fullSizeNetworkWidgetAspectRatio, halfSizeNetworkWidgetAspectRatio } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.const';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-network',
  templateUrl: './widget-network.component.html',
  styleUrls: ['./widget-network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetNetworkComponent implements WidgetComponent<WidgetInterfaceIpSettings> {
  size = input.required<SlotSize>();
  settings = input<WidgetInterfaceIpSettings>();

  protected isLoading = computed(() => {
    return !this.interfaces()
      || !this.interface()
      || !this.interfaceUsage()
      || !this.reportingData()
      || !this.chartData();
  });

  protected interfaces = toSignal(this.resources.networkInterfaces$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.value),
    filter((interfaces) => interfaces.length > 0),
  ));

  protected interface = computed(() => {
    return this.interfaces()?.find((nics) => nics.name === this.settings().interface);
  });

  protected interfaceUsage = toSignal(toObservable(this.interface).pipe(
    filter(Boolean),
    switchMap((nic) => this.resources.realtimeUpdates$.pipe(
      map((update) => update.fields.interfaces[nic.name]),
    )),
  ));

  protected reportingData = toSignal(toObservable(this.interface).pipe(
    filter(Boolean),
    switchMap((nic) => this.resources.networkInterfaceUpdate(nic.name)),
    filter((response) => !!response.length),
    map((response) => {
      const updatedResponse = response[0];
      (updatedResponse.data as number[][]).forEach((row, index) => {
        // remove first column and convert kilobits/s to bits/s
        (updatedResponse.data as number[][])[index] = row.slice(1).map((value) => value * kb);
      });
      return updatedResponse;
    }),
  ));

  protected isLinkStateUp = computed(() => {
    if (this.interfaceUsage().link_state) {
      return this.interfaceUsage().link_state === LinkState.Up;
    }
    return this.interface().state.link_state === LinkState.Up;
  });

  protected linkStateLabel = computed(() => {
    if (this.interfaceUsage().link_state) {
      return this.interfaceUsage().link_state.replace(/_/g, ' ');
    }
    return this.interface().state.link_state.replace(/_/g, ' ');
  });

  protected bitsIn = computed<number>(() => {
    return this.interfaceUsage().received_bytes_rate * 8;
  });

  protected bitsOut = computed<number>(() => {
    return this.interfaceUsage().sent_bytes_rate * 8;
  });

  protected networkWidgetAspectRatio = computed(() => {
    return this.size() === SlotSize.Full ? fullSizeNetworkWidgetAspectRatio : halfSizeNetworkWidgetAspectRatio;
  });

  protected showChart = computed(() => {
    return [SlotSize.Full, SlotSize.Half].includes(this.size());
  });

  protected showSecondaryInfo = computed(() => {
    return [SlotSize.Full].includes(this.size());
  });

  protected chartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const response = this.reportingData();
    const networkInterfaceName = this.interface().name;

    const labels: number[] = (response.data as number[][]).map((_, index) => {
      return (response.start + index) * 1000;
    });

    return {
      datasets: [
        {
          label: this.translate.instant('Incoming [{networkInterfaceName}]', { networkInterfaceName }),
          data: (response.data as number[][]).map((item, index) => ({ x: labels[index], y: item[0] })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
        {
          label: this.translate.instant('Outgoing [{networkInterfaceName}]', { networkInterfaceName }),
          data: (response.data as number[][]).map((item, index) => ({ x: labels[index], y: -item[1] })),
          borderColor: currentTheme.orange,
          backgroundColor: currentTheme.orange,
          pointBackgroundColor: currentTheme.orange,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
      ],
    };
  });

  protected chartOptions = computed<ChartOptions<'line'>>(() => {
    const aspectRatio = this.networkWidgetAspectRatio();

    return {
      aspectRatio,
      responsive: true,
      maintainAspectRatio: true,
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
                label = buildNormalizedFileSize(Math.abs(Number(tooltipItem.parsed.y)), 'b', 10);
              }
              return label + '/s';
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
              return buildNormalizedFileSize(Math.abs(Number(value)), 'b', 10) + '/s';
            },
          },
        },
      },
    };
  });

  constructor(
    private resources: WidgetResourcesService,
    private localeService: LocaleService,
    private translate: TranslateService,
    private theme: ThemeService,
  ) {}

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
}
