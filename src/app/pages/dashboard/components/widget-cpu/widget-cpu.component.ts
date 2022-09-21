import {
  Component, AfterViewInit, Input, ElementRef, OnChanges,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { NgForm } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  Chart, ChartData, ChartDataSets, ChartOptions, ChartTooltipItem, InteractionMode,
} from 'chart.js';
import * as d3 from 'd3';
import { Subject, Subscription } from 'rxjs';
import {
  filter, map, throttleTime,
} from 'rxjs/operators';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { CoreEvent } from 'app/interfaces/events';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { GaugeConfig, GaugeData } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetCpuData } from 'app/pages/dashboard/interfaces/widget-data.interface';
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
})
export class WidgetCpuComponent extends WidgetComponent implements AfterViewInit, OnChanges {
  @Input() data: Subject<CoreEvent>;
  @Input() cpuModel: string;
  chart: any;// Chart.js instance with per core data
  ctx: CanvasRenderingContext2D; // canvas context for chart.js
  private _cpuData: WidgetCpuData;
  get cpuData(): WidgetCpuData { return this._cpuData; }
  set cpuData(value) {
    this._cpuData = value;
  }

  cpuAvg: GaugeConfig;
  title: string = this.translate.instant('CPU');
  subtitle: string = this.translate.instant('% of all cores');
  configurable = false;
  chartId = UUID.UUID();
  coreCount: number;
  threadCount: number;
  hyperthread: boolean;
  legendData: ChartDataSets[];
  screenType = 'Desktop'; // Desktop || Mobile

  // Mobile Stats
  tempAvailable = false;
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
  protected currentTheme: Theme;
  private utils: ThemeUtils;
  private dataSubscription: Subscription;

  constructor(
    public translate: TranslateService,
    public mediaObserver: MediaObserver,
    private el: ElementRef<HTMLElement>,
    public themeService: ThemeService,
    private store$: Store<AppState>,
  ) {
    super(translate);

    this.utils = new ThemeUtils();

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const size = {
        width: evt.mqAlias === 'xs' ? 320 : 536,
        height: 140,
      };

      const st = evt.mqAlias === 'xs' ? 'Mobile' : 'Desktop';
      if (this.chart && this.screenType !== st) {
        this.chart.resize(size);
      }

      this.screenType = st;
    });

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.threadCount = sysInfo.cores;
      this.coreCount = sysInfo.physical_cores;
      this.hyperthread = this.threadCount !== this.coreCount;
    });
  }

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }

    this.dataSubscription?.unsubscribe();
    this.data.pipe(
      filter((evt) => evt.name === 'CpuStats'),
      map((evt) => evt.data),
      throttleTime(500),
      untilDestroyed(this),
    ).subscribe((cpuData: AllCpusUpdate) => {
      if (!cpuData.average) {
        return;
      }

      this.setCpuLoadData(['Load', parseInt(cpuData.average.usage.toFixed(1))]);
      this.setCpuData(cpuData);
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
    this.tempAvailable = Boolean(cpuData.temperature && Object.keys(cpuData.temperature).length > 0);
    const usageColumn: GaugeData = ['Usage'];
    let temperatureColumn: GaugeData = ['Temperature'];
    const temperatureValues = [];

    // Filter out stats per thread
    const keys = Object.keys(cpuData);
    const threads = keys.filter((cpuUpdateAttribute) => !Number.isNaN(parseFloat(cpuUpdateAttribute)));

    for (let i = 0; i < this.threadCount; i++) {
      usageColumn.push(parseInt(cpuData[i].usage.toFixed(1)));

      const mod = threads.length % 2;
      const temperatureIndex = this.hyperthread ? Math.floor(i / 2 - mod) : i;

      if (cpuData.temperature && cpuData.temperature[temperatureIndex] && !cpuData.temperature_celsius) {
        const temperatureAsCelsius = (cpuData.temperature[temperatureIndex] / 10 - 273.05).toFixed(0);
        temperatureValues.push(parseInt(temperatureAsCelsius));
      } else if (cpuData.temperature_celsius && cpuData.temperature_celsius[temperatureIndex]) {
        temperatureValues.push(cpuData.temperature_celsius[temperatureIndex].toFixed(0));
      }
    }
    temperatureColumn = temperatureColumn.concat(temperatureValues);
    this.setMobileStats(Object.assign([], usageColumn), Object.assign([], temperatureColumn));

    return [usageColumn, temperatureColumn];
  }

  setMobileStats(usage: number[], temps: number[]): void {
    // Usage
    usage.splice(0, 1);
    this.usageMin = Number(Math.min(...usage).toFixed(0));
    this.usageMax = Number(Math.max(...usage).toFixed(0));
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

  setPreferences(form: NgForm): void {
    const filtered: string[] = [];
    for (const i in form.value) {
      if (form.value[i]) {
        filtered.push(i);
      }
    }
  }

  // chart.js renderer
  renderChart(): void {
    if (!this.ctx) {
      const el: HTMLCanvasElement = this.el.nativeElement.querySelector('#cpu-cores-chart canvas');
      if (!el) { return; }

      const ds = this.makeDatasets(this.cpuData.data);
      this.ctx = el.getContext('2d');

      const data = {
        labels: this.labels,
        datasets: ds,
      };

      const options: ChartOptions = {
        events: ['mousemove', 'mouseout'],
        onHover: (event: MouseEvent) => {
          if (event.type === 'mouseout') {
            this.legendData = null;
            this.legendIndex = null;
          }
        },
        tooltips: {
          enabled: false,
          mode: 'nearest' as InteractionMode,
          intersect: true,
          callbacks: {
            label: (tt: ChartTooltipItem, data: ChartData) => {
              if (this.screenType.toLowerCase() === 'mobile') {
                this.legendData = null;
                this.legendIndex = null;
                return;
              }

              this.legendData = data.datasets;
              this.legendIndex = tt.index;

              return '';
            },
          },
          custom: () => {},
        },
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        responsiveAnimationDuration: 0,
        animation: {
          duration: 1000,
          animateRotate: true,
          animateScale: true,
        },
        hover: {
          animationDuration: 0,
        },
        scales: {
          xAxes: [{
            type: 'category',
            labels: this.labels,
          } as any],
          yAxes: [{
            ticks: {
              max: 100,
              beginAtZero: true,
            },
          }],
        },
      };

      this.chart = new Chart(this.ctx, {
        type: 'bar',
        data,
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

  protected makeDatasets(data: GaugeData[]): ChartDataSets[] {
    const datasets: ChartDataSets[] = [];
    const labels: string[] = [];
    for (let i = 0; i < this.threadCount; i++) {
      labels.push((i).toString());
    }
    this.labels = labels;

    // Create the data...
    data.forEach((item, index) => {
      const ds: ChartDataSets = {
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

      const bgRgb = this.utils.convertToRgb((this.currentTheme[color as keyof Theme]) as string).rgb;

      ds.backgroundColor = this.utils.rgbToString(bgRgb, 0.85);
      ds.borderColor = this.utils.rgbToString(bgRgb);
      datasets.push(ds);
    });

    return datasets;
  }

  stripVar(str: string): string {
    return str.replace('var(--', '').replace(')', '');
  }

  getHighlightColor(opacity: number): string {
    // Get highlight color
    const currentTheme = this.themeService.currentTheme();
    const txtColor = currentTheme.fg2;
    const valueType = this.utils.getValueType(txtColor);

    // convert to rgb
    const rgb = valueType === 'hex' ? this.utils.hexToRgb(txtColor).rgb : this.utils.rgbToArray(txtColor);

    // return rgba
    const rgba = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;

    return rgba;
  }
}
