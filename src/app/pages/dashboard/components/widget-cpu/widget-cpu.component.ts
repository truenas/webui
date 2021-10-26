import {
  Component, AfterViewInit, Input, ViewChild, OnDestroy, ElementRef,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  Chart, ChartData, ChartDataSets, ChartOptions, ChartTooltipItem, InteractionMode,
} from 'chart.js';
import * as d3 from 'd3';
import { Subject } from 'rxjs';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { ViewChartBarComponent } from 'app/core/components/view-chart-bar/view-chart-bar.component';
import { GaugeConfig, ViewChartGaugeComponent } from 'app/core/components/view-chart-gauge/view-chart-gauge.component';
import { CoreEvent } from 'app/interfaces/events';
import { CpuStatsEvent } from 'app/interfaces/events/cpu-stats-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetCpuData } from 'app/pages/dashboard/interfaces/widget-data.interface';
import { Theme } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'widget-cpu',
  templateUrl: './widget-cpu.component.html',
  styleUrls: ['./widget-cpu.component.scss'],
})
export class WidgetCpuComponent extends WidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('load', { static: true }) cpuLoad: ViewChartGaugeComponent;
  @ViewChild('cores', { static: true }) cpuCores: ViewChartBarComponent;
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
  title: string = T('CPU');
  subtitle: string = T('% of all cores');
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

  legendColors: string[];
  legendIndex: number;

  labels: string[] = [];
  protected currentTheme: Theme;
  private utils: ThemeUtils;

  constructor(
    router: Router,
    public translate: TranslateService,
    public mediaObserver: MediaObserver,
    private el: ElementRef<HTMLElement>,
  ) {
    super(translate);

    this.utils = new ThemeUtils();

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const size = {
        width: evt.mqAlias == 'xs' ? 320 : 536,
        height: 140,
      };

      const st = evt.mqAlias == 'xs' ? 'Mobile' : 'Desktop';
      if (this.chart && this.screenType !== st) {
        this.chart.resize(size);
      }

      this.screenType = st;
    });

    // Fetch CPU core count from SysInfo cache
    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      this.threadCount = evt.data.cores;
      this.coreCount = evt.data.physical_cores;
      this.hyperthread = this.threadCount !== this.coreCount;
    });

    this.core.emit({
      name: 'SysInfoRequest',
      sender: this,
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.core.register({
      observerClass: this,
      eventName: 'ThemeChanged',
    }).pipe(untilDestroyed(this)).subscribe(() => {
      d3.select('#grad1 .begin')
        .style('stop-color', this.getHighlightColor(0));

      d3.select('#grad1 .end')
        .style('stop-color', this.getHighlightColor(0.15));
    });

    this.data.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.name !== 'CpuStats') {
        return;
      }

      const cpuData = (evt as CpuStatsEvent).data;
      if (!cpuData.average) {
        return;
      }

      this.setCpuLoadData(['Load', parseInt(cpuData.average.usage.toFixed(1))]);
      this.setCpuData(cpuData);
    });
  }

  parseCpuData(cpuData: AllCpusUpdate): (string | number)[][] {
    this.tempAvailable = Boolean(cpuData.temperature && Object.keys(cpuData.temperature).length > 0);
    const usageColumn: (string | number)[] = ['Usage'];
    let temperatureColumn: string[] = ['Temperature'];
    const temperatureValues = [];

    // Filter out stats per thread
    const keys = Object.keys(cpuData);
    const threads = keys.filter((n) => !Number.isNaN(parseFloat(n)));

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
    for (let u = 0; u < usage.length; u++) {
      if (usage[u] == this.usageMin) {
        this.usageMinThreads.push(Number(u.toFixed(0)));
      }

      if (usage[u] == this.usageMax) {
        this.usageMaxThreads.push(Number(u.toFixed(0)));
      }
    }

    // Temperature
    temps.splice(0, 1);
    this.tempMin = Number(Math.min(...temps).toFixed(0));
    this.tempMax = Number(Math.max(...temps).toFixed(0));
    this.tempMinThreads = [];
    this.tempMaxThreads = [];
    for (let t = 0; t < temps.length; t++) {
      if (temps[t] == this.tempMin) {
        this.tempMinThreads.push(Number(t.toFixed(0)));
      }

      if (temps[t] == this.tempMax) {
        this.tempMaxThreads.push(Number(t.toFixed(0)));
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

  setCpuLoadData(data: (string | number)[]): void {
    const config = {
      data,
      units: '%',
      diameter: 136,
      fontSize: 28,
      max: 100,
      subtitle: 'Avg Usage',
    } as GaugeConfig;
    this.cpuAvg = config;
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
        onHover: (e: MouseEvent) => {
          if (e.type == 'mouseout') {
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
              if (this.screenType.toLowerCase() == 'mobile') {
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
            maxBarThickness: 16,
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

  coresChartUpdate(): void {
    this.chart.load({
      columns: this.cpuData.data,
    });
  }

  protected makeDatasets(data: (string | number)[][]): ChartDataSets[] {
    const datasets: ChartDataSets[] = [];
    const labels: string[] = [];
    for (let i = 0; i < this.threadCount; i++) {
      labels.push((i).toString());
    }
    this.labels = labels;

    // Create the data...
    data.forEach((item, index) => {
      const ds: ChartDataSets = {
        label: item[0] as any,
        data: data[index].slice(1) as any,
        backgroundColor: '',
        borderColor: '',
        borderWidth: 1,
      };

      const accent = this.themeService.isDefaultTheme ? 'orange' : 'accent';
      let color;
      if (accent !== 'accent' && ds.label == 'Temperature') {
        color = accent;
      } else {
        const cssVar = ds.label == 'Temperature' ? accent : 'primary';
        color = this.stripVar(this.currentTheme[cssVar]);
      }

      const bgRGB = this.utils.convertToRGB((this.currentTheme[color as keyof Theme]) as string).rgb;

      ds.backgroundColor = this.rgbToString(bgRGB as any, 0.85);
      ds.borderColor = this.rgbToString(bgRGB as any);
      datasets.push(ds);
    });

    return datasets;
  }

  private processThemeColors(theme: Theme): string[] {
    return theme.accentColors.map((color) => theme[color]);
  }

  rgbToString(rgb: string[], alpha?: number): string {
    const a = alpha ? alpha.toString() : '1';
    return 'rgba(' + rgb.join(',') + ',' + a + ')';
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
    const rgb = valueType == 'hex' ? this.utils.hexToRGB(txtColor).rgb : this.utils.rgbToArray(txtColor);

    // return rgba
    const rgba = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + opacity + ')';

    return rgba;
  }
}
