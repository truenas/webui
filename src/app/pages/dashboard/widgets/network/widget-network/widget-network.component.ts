import {
  Component, ChangeDetectionStrategy, OnInit, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { map } from 'rxjs';
import { LinkState } from 'app/enums/network-interface.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { minSizeToActiveTrafficArrowIcon } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.const';
import { WidgetNetworkInterfaceInfo } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.interface';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-network',
  templateUrl: './widget-network.component.html',
  styleUrls: ['./widget-network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetNetworkComponent implements WidgetComponent, OnInit {
  size = input.required<SlotSize>();
  readonly LinkState = LinkState;

  protected interface = toSignal(this.resources.networkInterfaces$.pipe(
    map((state) => state?.value?.filter((nic) => nic.state.link_state !== LinkState.Down)),
    map(([firstInterface]) => firstInterface),
  ));

  protected interfaceData = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.interfaces),
    map((interfaces) => interfaces?.[this.interface().name]),
  ));

  protected isLinkStateUp = computed(() => {
    return this.interface().state.link_state === LinkState.Up;
  });
  // protected chartDataUpdates = toSignal();

  protected isLoading = computed(() => !this.interface() || !this.interfaceData());
  // protected serverTime = computed(() => {
  //   return this.initialServerTime();
  // });

  protected stats = computed<WidgetNetworkInterfaceInfo>(() => {
    const usageUpdate = this.interfaceData();

    const nextUpdate: WidgetNetworkInterfaceInfo = {
      name: this.interface().state.name,
      ip: this.interface().aliases[0]?.address,
      state: this.interface().state.link_state,
      bitsIn: this.interfaceData().received_bytes_rate * 8,
      bitsOut: this.interfaceData().sent_bytes_rate * 8,
      bitsLastSent: 0,
      bitsLastReceived: 0,
    };

    if (
      usageUpdate.sent_bytes_rate !== undefined
      && usageUpdate.sent_bytes_rate - nextUpdate.bitsLastSent > minSizeToActiveTrafficArrowIcon
    ) {
      nextUpdate.bitsLastSent = usageUpdate.sent_bytes_rate * 8;
    }

    if (
      usageUpdate.received_bytes_rate !== undefined
      && usageUpdate.received_bytes_rate - nextUpdate.bitsLastReceived > minSizeToActiveTrafficArrowIcon
    ) {
      nextUpdate.bitsLastReceived = usageUpdate.received_bytes_rate * 8;
    }

    return nextUpdate;
  });

  chartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const response = {} as ReportingData;
    const networkInterfaceName = this.stats().name;

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

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    aspectRatio: 540 / 200,
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

  ngOnInit(): void {
    console.info('WidgetNetworkComponent initialized');
  }
}
