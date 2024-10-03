import {
  ChangeDetectionStrategy, Component,
  computed,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TinyColor } from '@ctrl/tinycolor';
import { Store } from '@ngrx/store';
import { ChartData, ChartOptions } from 'chart.js';
import { map } from 'rxjs';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { GaugeData } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppsState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-cpu-core-bar',
  templateUrl: './cpu-core-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpuCoreBarComponent {
  hideTemperature = input<boolean>(false);
  hideUsage = input<boolean>(false);

  protected sysInfo = toSignal(this.store$.pipe(waitForSystemInfo));

  protected cpuData = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.cpu),
  ));

  protected isLoading = computed(() => !this.cpuData() || !this.sysInfo());
  protected threadCount = computed(() => this.sysInfo().cores);
  protected hyperthread = computed(() => this.sysInfo().cores !== this.sysInfo().physical_cores);

  stats = computed(() => {
    const data = this.parseCpuData(this.cpuData());

    return {
      labels: Array.from({ length: this.threadCount() }, (_, i) => (i + 1).toString()),
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

  constructor(
    private store$: Store<AppsState>,
    private resources: WidgetResourcesService,
    private theme: ThemeService,
  ) {}

  protected parseCpuData(cpuData: AllCpusUpdate): GaugeData[] {
    const usageColumn: GaugeData = ['Usage'];
    let temperatureColumn: GaugeData = ['Temperature'];
    const temperatureValues = [];

    // Filter out stats per thread
    const keys = Object.keys(cpuData);
    const threads = keys.filter((cpuUpdateAttribute) => !Number.isNaN(parseFloat(cpuUpdateAttribute)));

    for (let i = 0; i < this.threadCount(); i++) {
      usageColumn.push(parseInt(cpuData[i].usage.toFixed(1)));

      if (cpuData.temperature_celsius) {
        const mod = threads.length % 2;
        const temperatureIndex = this.hyperthread ? Math.floor(i / 2 - mod) : i;
        if (cpuData.temperature_celsius?.[temperatureIndex]) {
          temperatureValues.push(parseInt(cpuData.temperature_celsius[temperatureIndex].toFixed(0)));
        }
      }
    }
    temperatureColumn = temperatureColumn.concat(temperatureValues);

    return [
      this.hideUsage() ? [] : usageColumn,
      this.hideTemperature() ? [] : temperatureColumn,
    ];
  }
}
