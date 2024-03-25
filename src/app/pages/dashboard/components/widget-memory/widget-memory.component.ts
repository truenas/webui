import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  Component, ElementRef, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import {
  DomSanitizer, SafeStyle,
} from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  Chart, Color, ChartDataset, ChartOptions,
} from 'chart.js';
import { ChartConfiguration } from 'chart.js/dist/types';
import { filter, map, throttleTime } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetMemoryData } from 'app/pages/dashboard/interfaces/widget-data.interface';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { deepCloneState } from 'app/pages/dashboard/utils/deep-clone-state.helper';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-memory',
  templateUrl: './widget-memory.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-memory.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetMemoryComponent extends WidgetComponent implements OnInit {
  protected ecc$ = this.store$.pipe(waitForSystemInfo, map((sysInfo) => sysInfo.ecc_memory));
  protected isMobile$ = this.breakpointObserver.observe([Breakpoints.XSmall]).pipe(map((state) => state.matches));

  chart: Chart<'doughnut'>;
  isReady = false;
  subtitle: string = this.translate.instant('% of all cores');
  colorPattern: string[];
  labels: string[] = [this.translate.instant('Free'), this.translate.instant('ZFS Cache'), this.translate.instant('Services')];
  memData: WidgetMemoryData;
  private utils: ThemeUtils;

  constructor(
    public router: Router,
    public translate: TranslateService,
    private sanitizer: DomSanitizer,
    private el: ElementRef<HTMLElement>,
    public themeService: ThemeService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private resourcesUsageStore$: ResourcesUsageStore,
    private breakpointObserver: BreakpointObserver,
  ) {
    super(translate);

    this.utils = new ThemeUtils();
  }

  ngOnInit(): void {
    this.resourcesUsageStore$.virtualMemoryUsage$.pipe(
      throttleTime(500),
      deepCloneState(),
      filter((update) => Boolean(update?.used)),
      untilDestroyed(this),
    ).subscribe({
      next: (update) => {
        this.setMemData(update);
        this.renderChart();
        this.cdr.markForCheck();
      },
    });
  }

  bytesToGigabytes(value: number): number {
    return value / GiB;
  }

  parseMemData(data: MemoryStatsEventData): string[][] {
    const services = data.total - data.free - data.arc_size;

    return [
      [this.translate.instant('Free'), this.bytesToGigabytes(data.free).toFixed(1)],
      [this.translate.instant('ZFS Cache'), this.bytesToGigabytes(data.arc_size).toFixed(1)],
      [this.translate.instant('Services'), this.bytesToGigabytes(services).toFixed(1)],
    ];
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
    this.colorPattern = this.themeService.getColorPattern();
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

  initChart(): Chart<'doughnut'> {
    const el: HTMLCanvasElement = this.el.nativeElement.querySelector('.memory-usage-chart canvas');
    if (!el) {
      return undefined;
    }

    const datasets = this.makeDatasets(this.memData.data);

    const data = {
      datasets,
      labels: this.labels,
    };

    const options: ChartOptions<'doughnut'> = {
      cutout: '50%',
      plugins: {
        tooltip: {
          enabled: false,
        },
        legend: {
          display: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        animateRotate: true,
        animateScale: true,
      },
    };

    return new Chart(el.getContext('2d'), {
      type: 'doughnut',
      data,
      options,
    } as ChartConfiguration<'doughnut'>);
  }

  updateChart(chart: Chart<'doughnut'>): void {
    const ds = this.makeDatasets(this.memData.data);

    chart.data.datasets[0].data = ds[0].data as number[];
    chart.update();

    this.chart = chart;
  }

  protected makeDatasets(data: string[][]): ChartDataset[] {
    const datasets: ChartDataset[] = [];

    const ds: ChartDataset<'doughnut'> = {
      label: String(this.labels),
      data: data.map((x) => Number(x[1])),
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    };

    // Create the data...
    data.forEach((item, index) => {
      const bgRgb = this.themeService.getRgbBackgroundColorByIndex(index);

      (ds.backgroundColor as Color[]).push(this.utils.rgbToString(bgRgb, 0.85));
      (ds.borderColor as Color[]).push(this.utils.rgbToString(bgRgb));
    });

    datasets.push(ds);

    return datasets;
  }
}
