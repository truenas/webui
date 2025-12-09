import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { fullSizeNetworkWidgetAspectRatio } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.const';

@Component({
  selector: 'ix-network-chart',
  templateUrl: './network-chart.component.html',
  styleUrls: ['./network-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ViewChartAreaComponent],
})
export class NetworkChartComponent {
  private localeService = inject(LocaleService);

  data = input<ChartData<'line'>>();
  aspectRatio = input<number>(fullSizeNetworkWidgetAspectRatio);
  showLegend = input<boolean>(true);
  /**
   * Unit for displaying data rates.
   * - 'b' for bits (network throughput: Mb/s, Gb/s)
   * - 'B' for bytes (disk I/O: MiB/s, GiB/s)
   */
  unit = input<'b' | 'B'>('b');

  protected options = computed<ChartOptions<'line'>>(() => {
    const aspectRatio = this.aspectRatio();
    const showLegend = this.showLegend();
    const unit = this.unit();
    const base = unit === 'B' ? 2 : 10; // Use binary (base 2) for bytes, decimal (base 10) for bits

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
          display: showLegend,
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
                label += '0';
              } else {
                label += buildNormalizedFileSize(Math.abs(Number(tooltipItem.parsed.y)), unit, base);
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
              return buildNormalizedFileSize(Math.abs(Number(value)), unit, base) + '/s';
            },
          },
        },
      },
    };
  });
}
