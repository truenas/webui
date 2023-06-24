import {
  Component, Input, ElementRef, OnChanges,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import {
  DomSanitizer, SafeStyle,
} from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Chart, Color, ChartDataset, ChartOptions,
} from 'chart.js';
import { ChartConfiguration } from 'chart.js/dist/types';
import { Subject, Subscription } from 'rxjs';
import {
  filter, map, throttleTime,
} from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { ScreenType } from 'app/enums/screen-type.enum';
import { CoreEvent } from 'app/interfaces/events';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetMemoryData } from 'app/pages/dashboard/interfaces/widget-data.interface';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-memory',
  templateUrl: './widget-memory.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-memory.component.scss',
  ],
})
export class WidgetMemoryComponent extends WidgetComponent implements OnChanges {
  @Input() data: Subject<CoreEvent>;
  @Input() ecc = false;

  chart: Chart<'doughnut'>;
  isReady = false;
  subtitle: string = this.translate.instant('% of all cores');
  colorPattern: string[];
  labels: string[] = [this.translate.instant('Free'), this.translate.instant('ZFS Cache'), this.translate.instant('Services')];
  screenType = ScreenType.Desktop;
  memData: WidgetMemoryData;

  readonly ScreenType = ScreenType;

  private utils: ThemeUtils;
  private dataSubscription: Subscription;

  constructor(
    public router: Router,
    public translate: TranslateService,
    private sanitizer: DomSanitizer,
    public mediaObserver: MediaObserver,
    private el: ElementRef<HTMLElement>,
    public themeService: ThemeService,
  ) {
    super(translate);

    this.utils = new ThemeUtils();

    mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      const currentScreenType = changes[0].mqAlias === 'xs' ? ScreenType.Mobile : ScreenType.Desktop;
      this.screenType = currentScreenType;
    });
  }

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }

    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.data.pipe(
      filter((evt) => evt.name === 'MemoryStats'),
      map((evt) => evt.data as MemoryStatsEventData),
      throttleTime(500),
      untilDestroyed(this),
    ).subscribe((data: MemoryStatsEventData) => {
      if (!data.used) {
        return;
      }

      this.setMemData(data);
      this.renderChart();
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
    const el: HTMLCanvasElement = this.el.nativeElement.querySelector('#memory-usage-chart canvas');
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
