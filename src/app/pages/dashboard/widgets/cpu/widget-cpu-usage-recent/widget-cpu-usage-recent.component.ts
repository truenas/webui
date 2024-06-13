import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { filter, map } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { cpuUsageRecentWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.definition';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ix-widget-cpu-usage-recent',
  templateUrl: './widget-cpu-usage-recent.component.html',
  styleUrls: ['./widget-cpu-usage-recent.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuUsageRecentComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuUsageRecentWidget.name;

  protected isLoading = computed(() => {
    return !this.cpuData();
  });

  protected cpuData = toSignal(this.resources.cpuUpdate().pipe(
    filter((response) => !!response.length),
    map((response) => {
      const timeIndex = response[0].legend.indexOf('time');
      const userIndex = response[0].legend.indexOf('user');
      const systemIndex = response[0].legend.indexOf('system');
      if (timeIndex === -1 || this.errorHandler.isWebSocketError(response[0].data)) {
        return { labels: [], values: [] };
      }
      return {
        labels: response[0].data.map((item) => item[timeIndex]),
        values: response[0].data.map((item) => ([item[userIndex], item[systemIndex]])),
      };
    }),
  ));

  constructor(
    private theme: ThemeService,
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private localeService: LocaleService,
    private errorHandler: ErrorHandlerService,
  ) {}

  chartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const labels = this.cpuData().labels;
    const values = this.cpuData().values;

    return {
      datasets: [
        {
          label: this.translate.instant('User'),
          data: values.map((item, index) => ({ x: labels[index] * 1000, y: item[0] })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: false,
        },
        {
          label: this.translate.instant('System'),
          data: values.map((item, index) => ({ x: labels[index] * 1000, y: item[1] })),
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
            label: (item) => item.parsed.y.toFixed(1),
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
          type: 'linear',
          max: 100,
          beginAtZero: true,
        },
      },
    };
  });
}
