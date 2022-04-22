import {
  Component, AfterViewInit, Input, OnDestroy, ElementRef,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import {
  DomSanitizer, SafeStyle,
} from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { Chart, ChartColor, ChartDataSets } from 'chart.js';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { CoreEvent } from 'app/interfaces/events';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetMemoryData } from 'app/pages/dashboard/interfaces/widget-data.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'widget-memory',
  templateUrl: './widget-memory.component.html',
  styleUrls: ['./widget-memory.component.scss'],
})
export class WidgetMemoryComponent extends WidgetComponent implements AfterViewInit, OnDestroy {
  @Input() data: Subject<CoreEvent>;
  @Input() ecc = false;
  chart: Chart;// chart instance
  private _memData: WidgetMemoryData;
  get memData(): WidgetMemoryData { return this._memData; }
  set memData(value) {
    this._memData = value;
    if (this.legendData && typeof this.legendIndex !== 'undefined') {
      // C3 does not have a way to update tooltip when new data is loaded.
      // So this is the workaround
      this.legendData[0].value = this.memData.data[0][this.legendIndex + 1];
      this.legendData[1].value = this.memData.data[1][this.legendIndex + 1];
    }
  }

  isReady = false;
  title: string = this.translate.instant('Memory');
  subtitle: string = this.translate.instant('% of all cores');
  configurable = false;
  chartId = UUID.UUID();
  legendData: any;
  colorPattern: string[];
  currentTheme: Theme;

  private legendIndex: number;
  labels: string[] = [this.translate.instant('Free'), this.translate.instant('ZFS Cache'), this.translate.instant('Services')];

  screenType = 'Desktop';

  private utils: ThemeUtils;

  constructor(
    public router: Router,
    public translate: TranslateService,
    private sanitizer: DomSanitizer,
    public mediaObserver: MediaObserver,
    private el: ElementRef<HTMLElement>,
    private core: CoreService,
    public themeService: ThemeService,
  ) {
    super(translate);

    this.utils = new ThemeUtils();

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const st = evt.mqAlias === 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.core.register({ observerClass: this })
      .pipe(
        switchMap(() => this.data),
        untilDestroyed(this),
      ).subscribe((evt: CoreEvent) => {
        if (evt.name === 'MemoryStats') {
          if (!evt.data.used) {
            return;
          }

          this.setMemData(evt.data);
          this.renderChart();
        }
      });
  }

  bytesToGigabytes(value: number): number {
    return value / 1024 / 1024 / 1024;
  }

  parseMemData(data: MemoryStatsEventData): string[][] {
    /*
     * PROVIDED BY MIDDLEWARE
     * total
     * available
     * percent
     * used
     * free
     * active
     * inactive
     * buffers
     * cached
     * shared
     * wired
     * zfs_cache?
     * */

    const services = data['total'] - data['free'] - data['arc_size'];

    const columns = [
      ['Free', this.bytesToGigabytes(data['free']).toFixed(1)],
      ['ZFS Cache', this.bytesToGigabytes(data['arc_size']).toFixed(1)],
      ['Services', this.bytesToGigabytes(services).toFixed(1)],
    ];

    return columns;
  }

  setMemData(data: MemoryStatsEventData): void {
    const config = {
      title: this.translate.instant('Cores'),
      orientation: 'vertical',
      units: 'GiB',
      max: this.bytesToGigabytes(data.total).toFixed(1),
      data: this.parseMemData(data),
    };
    this.memData = config;
    this.currentTheme = this.themeService.currentTheme();
    this.colorPattern = this.processThemeColors(this.currentTheme);
    this.isReady = true;
    this.renderChart();
  }

  trustedSecurity(style: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  // chart.js renderer
  renderChart(): void {
    if (!this.chart) {
      this.chart = this.initChart();
    } else {
      this.updateChart(this.chart);
    }
  }
  initChart(): Chart {
    const el: HTMLCanvasElement = this.el.nativeElement.querySelector('#memory-usage-chart canvas');
    if (!el) {
      return;
    }

    const ds = this.makeDatasets(this.memData.data);

    const data = {
      labels: this.labels,
      datasets: ds,
    };

    const options = {
      // cutoutPercentage:85,
      tooltips: {
        enabled: false,
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
    };

    const chart = new Chart(el.getContext('2d'), {
      type: 'doughnut',
      data,
      options,
    });
    return chart;
  }

  updateChart(chart: Chart): void {
    const ds = this.makeDatasets(this.memData.data);

    chart.data.datasets[0].data = ds[0].data;
    chart.update();

    this.chart = chart;
  }

  protected makeDatasets(data: string[][]): ChartDataSets[] {
    const datasets: ChartDataSets[] = [];

    const ds: ChartDataSets = {
      label: this.labels as any,
      data: data.map((x) => x[1] as any),
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    };

    // Create the data...
    data.forEach((item, index) => {
      const bgColor = this.colorPattern[index];
      const bgColorType = this.utils.getValueType(bgColor);

      const bgRgb = bgColorType === 'hex' ? this.utils.hexToRgb(bgColor).rgb : this.utils.rgbToArray(bgColor);

      (ds.backgroundColor as ChartColor[]).push(this.rgbToString(bgRgb, 0.85));
      (ds.borderColor as ChartColor[]).push(this.rgbToString(bgRgb));
    });

    datasets.push(ds);

    return datasets;
  }

  private processThemeColors(theme: Theme): string[] {
    return theme.accentColors.map((color) => theme[color]);
  }

  rgbToString(rgb: number[], alpha?: number): string {
    const a = alpha ? alpha.toString() : '1';
    return 'rgba(' + rgb.join(',') + ',' + a + ')';
  }
}
