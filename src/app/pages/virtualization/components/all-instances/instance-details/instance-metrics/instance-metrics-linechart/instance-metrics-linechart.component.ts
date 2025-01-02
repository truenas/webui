import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LocaleService } from 'app/modules/language/locale.service';
import { ThemeService } from 'app/modules/theme/theme.service';

@Component({
  selector: 'ix-instance-metrics-linechart',
  templateUrl: './instance-metrics-linechart.component.html',
  styleUrls: ['./instance-metrics-linechart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgxSkeletonLoaderModule,
    BaseChartDirective,
    TranslateModule,
  ],
})
export class InstanceMetricsLineChartComponent {
  title = input.required<string>();
  data = input.required<number[]>();
  labels = input.required<number[]>();
  isLoading = input.required<boolean>();
  postfix = input<string>();

  constructor(
    private themeService: ThemeService,
    private localeService: LocaleService,
  ) {}

  chartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.themeService.currentTheme();

    return {
      datasets: [
        {
          label: this.title(),
          data: this.data().map((y, index) => ({ x: this.labels()[index], y })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: false,
        },
      ],
    };
  });

  chartOptions = computed<ChartOptions<'line'>>(() => {
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
          callbacks: {
            label: (item) => `${item.parsed.y} ${this.postfix() || ''}`,
          },
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
          type: 'time',
          time: {
            unit: 'second',
            displayFormats: {
              second: 'HH:mm:ss',
            },
            tooltipFormat: `${this.localeService.dateFormat} ${this.localeService.timeFormat}`,
          },
          ticks: {
            maxTicksLimit: 3,
            maxRotation: 0,
          },
        },
        y: {
          type: 'linear',
          beginAtZero: true,
        },
      },
    };
  });
}
