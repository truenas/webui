import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import {
  filter, map, shareReplay, skipWhile, switchMap,
} from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { networkWidgetAspectRatio } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.const';
import { processNetworkInterfaces } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.utils';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-network',
  templateUrl: './widget-network.component.html',
  styleUrls: ['./widget-network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetNetworkComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  protected isLoading = computed(() => !this.interface() || !this.interfaceUsage() || !this.reportingData());

  protected interface$ = this.resources.networkInterfaces$.pipe(
    skipWhile((state) => state.isLoading),
    map((state) => processNetworkInterfaces(state.value)),
    filter((interfaces) => interfaces.length > 0),
    map(([firstInterface]) => firstInterface),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected interface = toSignal(this.interface$);

  protected interfaceUsage = toSignal(this.resources.realtimeUpdates$.pipe(
    skipWhile(() => Boolean(!this.interface()?.name)),
    map((update) => update.fields.interfaces),
    map((interfaces) => interfaces?.[this.interface().name]),
  ));

  protected reportingData = toSignal(this.interface$.pipe(
    filter(Boolean),
    switchMap((networkInterface) => this.resources.networkInterfaceUpdate(networkInterface.name)),
    map((response) => {
      const updatedResponse = response[0];
      (updatedResponse.data as number[][]).forEach((row, index) => {
        // remove first column and convert kilobits/s to bytes
        (updatedResponse.data as number[][])[index] = row.slice(1).map((value) => value * KiB);
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

  protected chartOptions: ChartOptions<'line'> = {
    responsive: true,
    aspectRatio: networkWidgetAspectRatio,
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
