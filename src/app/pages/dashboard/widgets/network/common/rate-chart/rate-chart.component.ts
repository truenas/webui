import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { fullSizeNetworkWidgetAspectRatio } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.const';

@Component({
  selector: 'ix-rate-chart',
  templateUrl: './rate-chart.component.html',
  styleUrls: ['./rate-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ViewChartAreaComponent],
  providers: [NetworkSpeedPipe, FileSizePipe],
})
export class RateChartComponent {
  private localeService = inject(LocaleService);
  private translate = inject(TranslateService);
  private networkSpeedPipe = inject(NetworkSpeedPipe);
  private fileSizePipe = inject(FileSizePipe);

  data = input<ChartData<'line'>>();
  aspectRatio = input<number>(fullSizeNetworkWidgetAspectRatio);
  showLegend = input<boolean>(true);
  /**
   * Unit for displaying data.
   * - 'b' for bits: Shows as rates (Mb/s, Gb/s) for network throughput
   * - 'B' for bytes: Shows as absolute values (MiB, GiB) for disk I/O
   */
  unit = input<'b' | 'B'>('b');

  /**
   * Formats a value based on unit type.
   * - For bits ('b'): Uses NetworkSpeedPipe for network speed (e.g., "1 Mb/s")
   * - For bytes ('B'): Uses FileSizePipe for disk I/O (e.g., "1 MiB")
   */
  protected formatValue(value: number, unit: 'b' | 'B'): string {
    if (value === 0) {
      return unit === 'b' ? '0/s' : '0';
    }
    const absValue = Math.abs(value);

    if (unit === 'b') {
      // Network speed in bits per second
      return this.networkSpeedPipe.transform(absValue);
    }

    // Disk I/O in bytes
    return this.fileSizePipe.transform(absValue);
  }

  protected options = computed<ChartOptions<'line'>>(() => {
    const aspectRatio = this.aspectRatio();
    const showLegend = this.showLegend();
    const unit = this.unit();

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
              label += this.formatValue(Number(tooltipItem.parsed.y), unit);
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
              return this.formatValue(Number(value), unit);
            },
          },
        },
      },
    };
  });
}
