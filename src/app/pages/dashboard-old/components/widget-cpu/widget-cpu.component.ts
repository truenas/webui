import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import {
  Component, AfterViewInit, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, Inject,
} from '@angular/core';
import { TinyColor } from '@ctrl/tinycolor';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  Chart, ChartDataset, ChartOptions, ChartEvent,
} from 'chart.js';
import { ActiveElement } from 'chart.js/dist/types';
import * as d3 from 'd3';
import {
  filter, skipWhile, throttleTime,
} from 'rxjs/operators';
import { ScreenType } from 'app/enums/screen-type.enum';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { GaugeConfig, GaugeData } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { WidgetComponent } from 'app/pages/dashboard-old/components/widget/widget.component';
import { WidgetCpuData } from 'app/pages/dashboard-old/interfaces/widget-data.interface';
import { ResourcesUsageStore } from 'app/pages/dashboard-old/store/resources-usage-store.service';
import { deepCloneState } from 'app/pages/dashboard-old/utils/deep-clone-state.helper';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-cpu',
  templateUrl: './widget-cpu.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-cpu.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuComponent extends WidgetComponent implements AfterViewInit {
  cpuModel: string;

  chart: Chart; // Chart.js instance with per core data
  ctx: CanvasRenderingContext2D; // canvas context for chart.js
  cpuAvg: GaugeConfig;
  subtitle: string = this.translate.instant('% of all cores');
  coreCount: number;
  threadCount: number;
  hyperthread: boolean;
  legendData: ChartDataset[];
  screenType = ScreenType.Desktop;

  // Mobile Stats
  tempMax: number;
  tempMaxThreads: number[] = [];
  tempMin: number;
  tempMinThreads: number[] = [];

  usageMax: number;
  usageMaxThreads: number[] = [];
  usageMin: number;
  usageMinThreads: number[] = [];

  legendIndex: number;

  labels: string[] = [];
  isCpuAvgReady = false;
  cpuData: WidgetCpuData;

  protected currentTheme: Theme;

  get isDesktop(): boolean {
    return this.screenType === ScreenType.Desktop;
  }

  get isMobile(): boolean {
    return this.screenType === ScreenType.Mobile;
  }

  constructor(
    public translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private el: ElementRef<HTMLElement>,
    public themeService: ThemeService,
    private store$: Store<AppState>,
    private resourcesUsageStore$: ResourcesUsageStore,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    super();

    this.resourcesUsageStore$.cpuUsage$.pipe(
      throttleTime(500),
      skipWhile(() => this.document.hidden),
      deepCloneState(),
      filter((cpuData) => Boolean(cpuData?.average)),
      untilDestroyed(this),
    ).subscribe({
      next: (cpuData) => {
        this.setCpuLoadData(['Load', parseInt(cpuData.average.usage.toFixed(1))]);
        this.setCpuData(cpuData);
        this.cdr.markForCheck();
      },
    });

    this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        const size = {
          width: state.matches ? 320 : 536,
          height: 140,
        };

        const currentScreenType = state.matches ? ScreenType.Mobile : ScreenType.Desktop;

        if (this.chart && this.screenType !== currentScreenType) {
          this.chart.resize(size.width, size.height);
        }

        this.screenType = currentScreenType;
      });

    this.store$
      .pipe(waitForSystemInfo, untilDestroyed(this))
      .subscribe((sysInfo) => {
        this.cpuModel = sysInfo.model;
        this.threadCount = sysInfo.cores;
        this.coreCount = sysInfo.physical_cores;
        this.hyperthread = this.threadCount !== this.coreCount;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.store$.select(selectTheme).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      d3.select('#grad1 .begin').style('stop-color', this.getHighlightColor(0));
      d3.select('#grad1 .end').style('stop-color', this.getHighlightColor(0.15));
    });
  }

  parseCpuData(cpuData: AllCpusUpdate): GaugeData[] {
    const usageColumn: GaugeData = ['Usage'];
    let temperatureColumn: GaugeData = ['Temperature'];
    const temperatureValues = [];

    // Filter out stats per thread
    const keys = Object.keys(cpuData);
    const threads = keys.filter((cpuUpdateAttribute) => !Number.isNaN(parseFloat(cpuUpdateAttribute)));

    for (let i = 0; i < this.threadCount; i++) {
      usageColumn.push(parseInt(cpuData[i].usage.toFixed(1)));

      if (cpuData.temperature_celsius) {
        const mod = threads.length % 2;
        const temperatureIndex = this.hyperthread ? Math.floor(i / 2 - mod) : i;
        if (cpuData.temperature_celsius?.[temperatureIndex]) {
          temperatureValues.push(cpuData.temperature_celsius[temperatureIndex].toFixed(0));
        }
      }
    }
    temperatureColumn = temperatureColumn.concat(temperatureValues);
    this.setMobileStats(Object.assign([], usageColumn), Object.assign([], temperatureColumn));

    return [usageColumn, temperatureColumn];
  }

  setMobileStats(usage: number[], temps: number[]): void {
    // Usage
    usage.splice(0, 1);

    this.usageMin = usage?.length ? Number(Math.min(...usage).toFixed(0)) : 0;
    this.usageMax = usage?.length ? Number(Math.max(...usage).toFixed(0)) : 0;

    this.usageMinThreads = [];
    this.usageMaxThreads = [];
    for (let i = 0; i < usage.length; i++) {
      if (usage[i] === this.usageMin) {
        this.usageMinThreads.push(Number(i.toFixed(0)));
      }

      if (usage[i] === this.usageMax) {
        this.usageMaxThreads.push(Number(i.toFixed(0)));
      }
    }

    // Temperature
    temps.splice(0, 1);
    if (!temps.length) {
      this.tempMin = 0;
      this.tempMax = 0;
    } else {
      this.tempMin = Number(Math.min(...temps).toFixed(0));
      this.tempMax = Number(Math.max(...temps).toFixed(0));

      this.tempMinThreads = [];
      this.tempMaxThreads = [];
      for (let i = 0; i < temps.length; i++) {
        if (temps[i] === this.tempMin) {
          this.tempMinThreads.push(Number(i.toFixed(0)));
        }

        if (temps[i] === this.tempMax) {
          this.tempMaxThreads.push(Number(i.toFixed(0)));
        }
      }
    }
  }

  setCpuData(cpuData: AllCpusUpdate): void {
    const config = {
      title: this.translate.instant('Cores'),
      orientation: 'horizontal',
      max: 100,
      data: this.parseCpuData(cpuData),
    };
    this.cpuData = config;
    this.coresChartInit();
  }

  setCpuLoadData(data: GaugeData): void {
    this.onCpuAvgChanged(this.cpuAvg?.data, data);
  }

  private onCpuAvgChanged(oldData: GaugeData, newData: GaugeData): void {
    const config = {
      data: newData,
      units: '%',
      diameter: 136,
      fontSize: 28,
      max: 100,
      subtitle: this.translate.instant('Avg Usage'),
    } as GaugeConfig;
    this.cpuAvg = config;
    this.isCpuAvgReady = Boolean(oldData);
  }

  // chart.js renderer
  renderChart(): void {
    if (!this.ctx) {
      const el: HTMLCanvasElement = this.el.nativeElement.querySelector('.cpu-cores-chart canvas');
      if (!el) { return; }

      const ds = this.makeDatasets(this.cpuData.data);
      this.ctx = el.getContext('2d');

      const chartData = {
        labels: this.labels,
        datasets: ds,
      };

      const options: ChartOptions<'bar'> = {
        events: ['mousemove', 'mouseout'],
        onHover: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
          if (event.type === 'mouseout' || this.isMobile) {
            this.legendData = null;
            this.legendIndex = null;
            return;
          }

          if (elements.length > 0) {
            this.legendData = chart.data.datasets;
            this.legendIndex = elements[0].index;
          }
        },
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
          duration: 1000,
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
            labels: this.labels,
          },
          y: {
            type: 'linear',
            max: 100,
            beginAtZero: true,
          },
        },
      };

      this.chart = new Chart(this.ctx, {
        type: 'bar',
        data: chartData,
        options,
      });
    } else {
      const ds = this.makeDatasets(this.cpuData.data);

      this.chart.data.datasets[0].data = ds[0].data;
      this.chart.data.datasets[1].data = ds[1].data;
      this.chart.update();
    }
  }

  coresChartInit(): void {
    this.currentTheme = this.themeService.currentTheme();
    this.renderChart();
  }

  protected makeDatasets(data: GaugeData[]): ChartDataset[] {
    const datasets: ChartDataset[] = [];
    const labels: string[] = [];
    for (let i = 0; i < this.threadCount; i++) {
      labels.push((i).toString());
    }
    this.labels = labels;

    // Create the data...
    data.forEach((item, index) => {
      const ds: ChartDataset = {
        label: item[0] as string,
        data: data[index].slice(1) as number[],
        backgroundColor: '',
        borderColor: '',
        borderWidth: 1,
        maxBarThickness: 16,
      };

      const accent = this.themeService.isDefaultTheme ? 'orange' : 'accent';
      let color;
      if (accent !== 'accent' && ds.label === 'Temperature') {
        color = accent;
      } else {
        const cssVar = ds.label === 'Temperature' ? accent : 'primary';
        color = this.stripVar(this.currentTheme[cssVar]);
      }

      const backgroundColor = this.currentTheme[color as keyof Theme];

      ds.backgroundColor = new TinyColor(backgroundColor as string).setAlpha(0.85).toRgbString();
      ds.borderColor = backgroundColor;
      datasets.push(ds);
    });

    return datasets;
  }

  stripVar(str: string): string {
    return str.replace('var(--', '').replace(')', '');
  }

  getHighlightColor(opacity: number): string {
    const currentTheme = this.themeService.currentTheme();
    const txtColor = currentTheme.fg2;

    return new TinyColor(txtColor).setAlpha(opacity).toRgbString();
  }
}
