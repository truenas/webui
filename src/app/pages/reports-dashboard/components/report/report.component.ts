import {
  Component,
  AfterViewInit,
  Input,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { add, sub } from 'date-fns';
import { dygraphs } from 'dygraphs';
import _ from 'lodash';
import { lastValueFrom } from 'rxjs';
import {
  delay, filter, map, take,
} from 'rxjs/operators';
import { toggleMenuDuration } from 'app/constants/toggle-menu-duration';
import { ProductType } from 'app/enums/product-type.enum';
import { CoreEvent } from 'app/interfaces/events';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { ReportingAggregationKeys, ReportingData } from 'app/interfaces/reporting.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportingDatabaseError, ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { WebSocketService } from 'app/services/';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectTheme, waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

interface DateTime {
  dateFormat: string;
  timeFormat: string;
}

export interface TimeData {
  start: number;// Seconds since epoch time
  end?: number;// Seconds since epoch time
  step?: string;
  legend?: string;
}

interface TimeAxisData {
  timespan: string;
  timeformat: string;
  culling: number;
}

export interface Report extends ReportingGraph {
  isRendered?: boolean[];
  errorConf?: EmptyConfig;
}

export type LegendDataWithStackedTotalHtml = dygraphs.LegendData & {
  stackedTotalHTML: string;
  stackedTotal?: number;
};

@UntilDestroy()
@Component({
  selector: 'ix-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent extends WidgetComponent implements AfterViewInit, OnInit, OnChanges, OnDestroy {
  // Labels
  @Input() localControls?: boolean = true;
  @Input() dateFormat?: DateTime;
  @Input() report: Report;
  @Input() identifier?: string;
  @Input() isReversed?: boolean;
  @ViewChild(LineChartComponent, { static: false }) lineChart: LineChartComponent;

  data: ReportingData;
  ready = false;
  productType = window.localStorage['product_type'] as ProductType;
  private delay = 1000; // delayed report render time

  readonly ProductType = ProductType;

  get reportTitle(): string {
    const trimmed = this.report.title.replace(/[()]/g, '');
    return this.identifier ? trimmed.replace(/{identifier}/, this.identifier) : this.report.title;
  }

  get aggregationKeys(): ReportingAggregationKeys[] {
    return Object.keys(this.data.aggregations) as ReportingAggregationKeys[];
  }

  legendData: LegendDataWithStackedTotalHtml = {} as LegendDataWithStackedTotalHtml;
  subtitle: string = this.translate.instant('% of all cores');
  altTitle = '';
  isActive = true;

  currentStartDate: number;// as seconds from Unix Epoch
  currentEndDate: number;// as seconds from Unix Epoch
  timeZoomIndex = 4;

  timezone: string;

  stepForwardDisabled = true;

  get zoomInDisabled(): boolean {
    return this.timeZoomIndex >= (this.zoomLevels.length - 1);
  }
  get zoomOutDisabled(): boolean {
    return this.timeZoomIndex <= 0;
  }

  zoomLevels: TimeAxisData[] = [
    { timespan: '5M', timeformat: "%b '%y", culling: 6 }, // 6 months
    { timespan: '1M', timeformat: 'Week %W', culling: 4 }, // 1 month
    { timespan: '7d', timeformat: '%d %b', culling: 6 }, // 1 week
    { timespan: '24h', timeformat: '%a %H:%M', culling: 4 }, // 24hrs
    { timespan: '60m', timeformat: '%H:%M', culling: 6 }, // 60 minutes
  ];

  // Loader
  loader = false;

  // Chart Options
  showLegendValues = false;
  chartId = 'chart-' + UUID.UUID();
  chartColors: string[];

  get startTime(): string {
    return this.localeService.formatDateTime(new Date(this.currentStartDate), this.timezone);
  }
  get endTime(): string {
    return this.localeService.formatDateTime(new Date(this.currentEndDate), this.timezone);
  }

  formatTime(stamp: string): string {
    const parsed = Date.parse(stamp);
    const result = this.localeService.formatDateTimeWithNoTz(new Date(parsed));
    return result.toLowerCase() !== 'invalid date' ? result : null;
  }

  formatInterfaceUnit(value: string): string {
    if (value && value.split(' ', 2)[0] !== '0') {
      if (value.split(' ', 2)[1]) {
        value += '/s';
      } else {
        value += 'b/s';
      }
    }
    return value;
  }

  formatLegendSeries(series: dygraphs.SeriesLegendData[], data: ReportingData): dygraphs.SeriesLegendData[] {
    switch (data.name) {
      case 'interface':
        series.forEach((element) => {
          element.yHTML = this.formatInterfaceUnit(element.yHTML);
        });
        break;
      default:
        break;
    }
    return series;
  }

  formatData(data: ReportingData): ReportingData {
    switch (data.name) {
      case 'interface':
        if (data.aggregations) {
          for (const key in data.aggregations) {
            _.set(data.aggregations, key, data.aggregations[key as ReportingAggregationKeys].map(
              (value) => this.formatInterfaceUnit(value),
            ));
          }
        }
        break;
      default:
        break;
    }
    return data;
  }

  constructor(
    public translate: TranslateService,
    private reportsService: ReportsService,
    private ws: WebSocketService,
    protected localeService: LocaleService,
    private dialog: DialogService,
    private core: CoreService,
    private store$: Store<AppState>,
    private themeService: ThemeService,
  ) {
    super(translate);

    this.core.register({ observerClass: this, eventName: 'ReportData-' + this.chartId }).pipe(
      untilDestroyed(this),
    ).subscribe((evt: CoreEvent) => {
      this.data = this.formatData(evt.data);
      this.handleError(evt);
    });

    this.core.register({ observerClass: this, eventName: 'LegendEvent-' + this.chartId }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const clone = { ...evt.data };
      clone.xHTML = this.formatTime(evt.data.xHTML);
      clone.series = this.formatLegendSeries(evt.data.series, this.data);
      this.legendData = clone;
    });

    this.store$.select(selectTheme).pipe(
      filter(Boolean),
      map(() => this.themeService.currentTheme()),
      untilDestroyed(this),
    ).subscribe(() => {
      this.chartColors = this.themeService.getColorPattern();
    });

    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
    });

    this.store$.pipe(
      waitForPreferences,
      filter(() => Boolean(this.lineChart?.chart)),
      delay(toggleMenuDuration),
      untilDestroyed(this),
    ).subscribe(() => {
      this.lineChart.chart.resize();
    });
  }

  async ngOnInit(): Promise<void> {
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan);
    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  async ngAfterViewInit(): Promise<void> {
    this.stepForwardDisabled = true;
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.report) {
      if (changes.report.previousValue && !this.ready) {
        this.setupData(changes);
      } else if (!changes.report.previousValue) {
        setTimeout(() => {
          this.ready = true;
          this.setupData(changes);
        }, this.delay);
      } else if (changes.report.previousValue.title !== changes.report.currentValue.title) {
        this.setupData(changes);
      }
    }
  }

  private async setupData(changes: SimpleChanges): Promise<void> {
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan);
    const identifier = changes.report.currentValue.identifiers ? changes.report.currentValue.identifiers[0] : null;
    this.fetchReportData(rrdOptions, changes.report.currentValue, identifier);
  }

  setChartInteractive(value: boolean): void {
    this.isActive = value;
  }

  async timeZoomIn(): Promise<void> {
    // more detail
    const max = 4;
    if (this.timeZoomIndex === max) { return; }
    this.timeZoomIndex += 1;
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  async timeZoomOut(): Promise<void> {
    // less detail
    const min = Number(0);
    if (this.timeZoomIndex === min) { return; }
    this.timeZoomIndex -= 1;
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  async stepBack(): Promise<void> {
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan, 'backward', this.currentStartDate);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  async stepForward(): Promise<void> {
    const zoom = this.zoomLevels[this.timeZoomIndex];

    const rrdOptions = await this.convertTimespan(zoom.timespan, 'forward', this.currentEndDate);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReportData(rrdOptions, this.report, identifier);
  }

  // Convert timespan to start/end options for RRDTool
  async convertTimespan(timespan: string, direction = 'backward', currentDate?: number): Promise<TimeData> {
    let durationUnit: keyof Duration;
    let value: number;

    const now = await lastValueFrom(this.reportsService.getServerTime().pipe(untilDestroyed(this)));

    let startDate: Date;
    let endDate: Date;
    if (direction === 'backward' && !currentDate) {
      endDate = now;
    } else if (direction === 'backward' && currentDate) {
      endDate = new Date(currentDate);
    } else if (direction === 'forward' && currentDate) {
      startDate = new Date(currentDate);
    } else {
      throw new Error(
        'A current date parameter must be specified when stepping forward in time!\n direction specified was ' + direction,
      );
    }

    switch (timespan) {
      case '5M':
        durationUnit = 'months';
        value = 5;
        break;
      case '1M':
        durationUnit = 'months';
        value = 1;
        break;
      case '7d':
        durationUnit = 'days';
        value = 7;
        break;
      case '24h':
        durationUnit = 'hours';
        value = 24;
        break;
      case '60m':
        durationUnit = 'minutes';
        value = 60;
        break;
    }

    if (direction === 'backward') {
      const subOptions: Duration = {};
      subOptions[durationUnit] = value;
      startDate = sub(endDate, subOptions);
    } else if (direction === 'forward') {
      const subOptions: Duration = {};
      subOptions[durationUnit] = value;
      endDate = add(startDate, subOptions);
    }

    // if endDate is in the future, reset with endDate to now
    if (endDate.getTime() >= now.getTime()) {
      endDate = new Date();
      const subOptions: Duration = {};
      subOptions[durationUnit] = value;
      startDate = sub(endDate, subOptions);
      this.stepForwardDisabled = true;
    } else {
      this.stepForwardDisabled = false;
    }

    return {
      start: startDate.getTime(),
      end: endDate.getTime(),
      step: '10',
    };
  }

  fetchReportData(rrdOptions: TimeData, report: Report, identifier?: string): void {
    // Report options
    const params = identifier ? { name: report.name, identifier } : { name: report.name };

    // Time scale options
    const start = Math.floor(rrdOptions.start / 1000);
    const end = Math.floor(rrdOptions.end / 1000);
    const timeFrame = { start, end };

    this.core.emit({
      name: 'ReportDataRequest',
      data: {
        report,
        params,
        timeFrame,
        truncate: this.stepForwardDisabled,
      },
      sender: this,
    });
  }

  // Will be used for back of flip card
  setPreferences(form: NgForm): void {
    const filtered: string[] = [];
    for (const i in form.value) {
      if (form.value[i]) {
        filtered.push(i);
      }
    }
  }

  handleError(evt: CoreEvent): void {
    if (evt.data?.name === 'FetchingError' && evt.data?.data?.error === ReportingDatabaseError.InvalidTimestamp) {
      const err = evt.data.data;
      this.report.errorConf = {
        type: EmptyType.Errors,
        large: false,
        compact: false,
        title: this.translate.instant('The reporting database is broken'),
        button: {
          label: this.translate.instant('Fix database'),
          action: () => {
            const errorMessage = err.reason ? err.reason.replace('[EINVALIDRRDTIMESTAMP] ', '') : null;
            const helpMessage = this.translate.instant('You can clear reporting database and start data collection immediately.');
            const message = errorMessage ? `${errorMessage}<br>${helpMessage}` : helpMessage;
            this.dialog.confirm({
              title: this.translate.instant('The reporting database is broken'),
              message,
              buttonMsg: this.translate.instant('Clear'),
            }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.ws.call('reporting.clear').pipe(take(1), untilDestroyed(this)).subscribe(() => {
                window.location.reload();
              });
            });
          },
        },
      };
    }
  }
}
