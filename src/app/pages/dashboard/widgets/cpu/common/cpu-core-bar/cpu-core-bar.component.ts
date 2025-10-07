import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TinyColor } from '@ctrl/tinycolor';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { GaugeData } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { ThemeService } from 'app/modules/theme/theme.service';
import { WidgetStaleDataNoticeComponent } from 'app/pages/dashboard/components/widget-stale-data-notice/widget-stale-data-notice.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';

@Component({
  selector: 'ix-cpu-core-bar',
  templateUrl: './cpu-core-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSkeletonLoaderModule, BaseChartDirective, WidgetStaleDataNoticeComponent],
})
export class CpuCoreBarComponent {
  private resources = inject(WidgetResourcesService);
  private theme = inject(ThemeService);

  hideTemperature = input<boolean>(false);
  hideUsage = input<boolean>(false);

  protected cpuDataState = toSignal(
    this.resources.cpuUpdatesWithStaleDetection().pipe(takeUntilDestroyed()),
  );

  protected isStale = computed(() => this.cpuDataState()?.isStale ?? false);
  protected isLoading = computed(() => !this.cpuDataState()?.value && !this.isStale());
  protected coreCount = computed(() => {
    const cpuData = this.cpuDataState()?.value;
    if (!cpuData) return 0;

    const cpus = Object.keys(cpuData)
      .filter((key) => key.startsWith('cpu'))
      .map((key) => key.replace('cpu', ''))
      .filter(Boolean)
      .map((coreNumber) => Number(coreNumber))
      .filter((key) => !Number.isNaN(key));

    return Math.max(...cpus) + 1;
  });

  stats = computed(() => {
    const cpuData = this.cpuDataState()?.value;
    if (!cpuData) return { labels: [], values: [] };

    const data = this.parseCpuData(cpuData);

    return {
      labels: Array.from({ length: this.coreCount() }, (_, i) => (i + 1).toString()),
      values: data.map((item, index) => ({
        data: item.slice(1) as number[],
        color: this.theme.getRgbBackgroundColorByIndex(index),
      })),
    };
  });

  chartData = computed<ChartData<'bar'>>(() => {
    const labels = this.stats().labels;
    const values = this.stats().values;

    return {
      labels,
      datasets: values.map((value) => ({
        data: value.data,
        borderWidth: 1,
        maxBarThickness: 16,

        backgroundColor: new TinyColor(value.color).setAlpha(0.85).toHex8String(),
        borderColor: value.color,
      })),
    };
  });

  chartOptions = computed<ChartOptions<'bar'>>(() => {
    const labels = this.stats().labels;

    return {
      interaction: {
        intersect: false,
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      animation: {
        duration: 0,
      },
      transitions: {
        active: {
          animation: {
            duration: 0,
          },
        },
      },
      scales: {
        x: {
          type: 'category',
          labels,
        },
        y: {
          type: 'linear',
          max: 100,
          beginAtZero: true,
        },
      },
    };
  });

  protected parseCpuData(cpuData: AllCpusUpdate): GaugeData[] {
    const usageColumn: GaugeData = ['Usage'];
    const temperatureColumn: GaugeData = ['Temperature'];

    for (let i = 0; i < this.coreCount(); i++) {
      const usage = parseInt(cpuData[`cpu${i}`].usage?.toFixed(1) || '0');
      const temperature = parseInt(cpuData[`cpu${i}`].temp?.toFixed(0) || '0');

      usageColumn.push(usage);
      temperatureColumn.push(temperature);
    }

    return [
      this.hideUsage() ? [] : usageColumn,
      this.hideTemperature() ? [] : temperatureColumn,
    ];
  }
}
