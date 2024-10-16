import {
  ChangeDetectionStrategy, Component, computed, input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, map, startWith, tap,
} from 'rxjs';
import { oneMinuteMillis } from 'app/constants/time.constant';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { cpuUsageRecentWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.definition';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ix-widget-cpu-usage-recent',
  templateUrl: './widget-cpu-usage-recent.component.html',
  styleUrls: ['./widget-cpu-usage-recent.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgxSkeletonLoaderModule,
    BaseChartDirective,
    TranslateModule,
  ],
})
export class WidgetCpuUsageRecentComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuUsageRecentWidget.name;

  protected isLoading = computed(() => {
    return !this.chartData();
  });

  protected cpuUsage = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.cpu.average),
    tap((realtimeUpdate) => {
      this.cachedCpuStats.update((cachedStats) => {
        return [...cachedStats, [realtimeUpdate.user, realtimeUpdate.system]].slice(-60);
      });
    }),
  ));

  protected initialCpuStats = toSignal(this.resources.cpuLastMinuteStats().pipe(
    filter((response) => !!response.length),
    map((response) => {
      const [update] = response;

      const userIndex = update.legend.indexOf('user');
      const systemIndex = update.legend.indexOf('system');

      return (update.data as number[][]).slice(-60).map((item) => ([item[userIndex], item[systemIndex]]));
    }),
    startWith(Array.from({ length: 60 }, () => ([0, 0]))),
  ));

  protected cachedCpuStats = signal<number[][]>([]);
  protected cpuStats = computed(() => {
    const initialStats = this.initialCpuStats();
    const cachedStats = this.cachedCpuStats();
    return [...initialStats, ...cachedStats].slice(-60);
  });

  constructor(
    private theme: ThemeService,
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private localeService: LocaleService,
  ) {}

  chartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const startDate = Date.now() - oneMinuteMillis;
    const values = this.cpuStats();
    const labels = values.map((_, index) => (startDate + (index * 1000)));

    return {
      datasets: [
        {
          label: this.translate.instant('User'),
          data: values.map((item, index) => ({ x: labels[index], y: item[0] })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: false,
        },
        {
          label: this.translate.instant('System'),
          data: values.map((item, index) => ({ x: labels[index], y: item[1] })),
          borderColor: currentTheme.orange,
          backgroundColor: currentTheme.orange,
          pointBackgroundColor: currentTheme.orange,
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
          align: 'end',
          labels: {
            boxPadding: 2,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.parsed.y.toFixed(1)}%`,
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
          max: 100,
          beginAtZero: true,
        },
      },
    };
  });
}
