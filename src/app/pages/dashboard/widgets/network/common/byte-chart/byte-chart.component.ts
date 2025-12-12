import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { fullSizeNetworkWidgetAspectRatio } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.const';

/**
 * A reusable time-series chart component for displaying byte-based metrics over time.
 *
 * Can display data as:
 * - Rates (bytes/s) - for network traffic, disk throughput
 * - Cumulative values (bytes) - for block I/O deltas, data transfers
 *
 * @example
 * // Network traffic (shows rates)
 * <ix-byte-chart [data]="networkData" [showAsRate]="true"></ix-byte-chart>
 *
 * // Block I/O (shows cumulative)
 * <ix-byte-chart [data]="diskData" [showAsRate]="false"></ix-byte-chart>
 */
@Component({
  selector: 'ix-byte-chart',
  templateUrl: './byte-chart.component.html',
  styleUrls: ['./byte-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ViewChartAreaComponent],
  providers: [NetworkSpeedPipe, FileSizePipe],
})
export class ByteChartComponent {
  private localeService = inject(LocaleService);
  private translate = inject(TranslateService);
  private networkSpeedPipe = inject(NetworkSpeedPipe);
  private fileSizePipe = inject(FileSizePipe);

  data = input<ChartData<'line'>>();
  aspectRatio = input<number>(fullSizeNetworkWidgetAspectRatio);
  showLegend = input<boolean>(true);
  /**
   * Whether to show values as rates (with /s suffix) or as cumulative values.
   * All values are in bytes.
   * - true (default): Shows rates (e.g., "1 MiB/s") - for network traffic
   * - false: Shows cumulative values (e.g., "1 MiB") - for block I/O deltas
   */
  showAsRate = input<boolean>(true);

  /**
   * Formats a value based on showAsRate setting
   * - If showAsRate=true: Uses NetworkSpeedPipe (e.g., "1 MiB/s")
   * - If showAsRate=false: Uses FileSizePipe (e.g., "1 MiB")
   */
  protected formatValue(value: number): string {
    const absValue = Math.abs(value);

    if (this.showAsRate()) {
      // Format as rate (bytes per second) using NetworkSpeedPipe
      if (absValue === 0) {
        return '0/s';
      }
      return this.networkSpeedPipe.transform(absValue);
    }

    // Format as cumulative bytes using FileSizePipe (no /s suffix)
    if (absValue === 0) {
      return '0';
    }
    return this.fileSizePipe.transform(absValue);
  }

  protected options = computed<ChartOptions<'line'>>(() => {
    const aspectRatio = this.aspectRatio();
    const showLegend = this.showLegend();

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
              label += this.formatValue(Number(tooltipItem.parsed.y));
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
              return this.formatValue(Number(value));
            },
          },
        },
      },
    };
  });
}
