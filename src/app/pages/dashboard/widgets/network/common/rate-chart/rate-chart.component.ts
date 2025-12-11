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
   * Unit for displaying data rates.
   * - 'b' for bits (network throughput: Mb/s, Gb/s)
   * - 'B' for bytes (disk I/O: MiB/s, GiB/s)
   */
  unit = input<'b' | 'B'>('b');

  /**
   * Whether to display values as rates (with /s suffix).
   * - true: Shows rates like "1 Mb/s" or "2 MiB/s" (for time-series charts)
   * - false: Shows absolute values like "1 Mb" or "2 MiB"
   */
  showRate = input<boolean>(true);

  /**
   * Formats a value based on unit type and rate display setting.
   * - For bits with rate: Uses NetworkSpeedPipe ("{bits}/s" translation)
   * - For bits without rate: Uses FileSizePipe with base 10
   * - For bytes with rate: Uses FileSizePipe with "{size}/s" translation
   * - For bytes without rate: Uses FileSizePipe
   */
  private formatValue(value: number, unit: 'b' | 'B', asRate: boolean): string {
    if (value === 0) {
      return asRate ? '0/s' : '0';
    }
    const absValue = Math.abs(value);

    if (unit === 'b' && asRate) {
      // Network speed: uses NetworkSpeedPipe which has built-in translation
      return this.networkSpeedPipe.transform(absValue);
    }

    const formatted = this.fileSizePipe.transform(absValue);

    if (asRate) {
      // Use translation pattern like NetworkSpeedPipe does
      return this.translate.instant('{size}/s', { size: formatted });
    }

    return formatted;
  }

  protected options = computed<ChartOptions<'line'>>(() => {
    const aspectRatio = this.aspectRatio();
    const showLegend = this.showLegend();
    const unit = this.unit();
    const asRate = this.showRate();

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
              label += this.formatValue(Number(tooltipItem.parsed.y), unit, asRate);
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
              return this.formatValue(Number(value), unit, asRate);
            },
          },
        },
      },
    };
  });
}
