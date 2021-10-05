import {
  Component,
  AfterViewInit,
  Input,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { add, sub } from 'date-fns';
import { filter, take } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { CoreEvent } from 'app/interfaces/events';
import { ThemeChangedEvent, ThemeDataEvent } from 'app/interfaces/events/theme-events.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportingDatabaseError, ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { WebSocketService, SystemGeneralService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { Theme } from 'app/services/theme/theme.service';

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

export interface Report {
  name: string;
  title: string;
  vertical_label: string;
  identifiers?: string[];
  isRendered?: boolean[];
  stacked: boolean;
  stacked_show_total: boolean;
  errorConf?: EmptyConfig;
}

@UntilDestroy()
@Component({
  selector: 'report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent extends WidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  // Labels
  @Input() localControls?: boolean = true;
  @Input() dateFormat?: DateTime;
  @Input() report: Report;
  @Input() multipathTitle?: string;
  @Input() identifier?: string;
  // TODO: Make boolean
  @Input() retroLogo?: string | number;
  @ViewChild(LineChartComponent, { static: false }) lineChart: LineChartComponent;

  data: ReportingData;
  ready = false;
  product_type = window.localStorage['product_type'] as ProductType;
  private delay = 1000; // delayed report render time

  readonly ProductType = ProductType;

  get reportTitle(): string {
    let trimmed = this.report.title.replace(/[\(\)]/g, '');
    if (this.multipathTitle) {
      trimmed = trimmed.replace(this.identifier, '');
      return trimmed;
    }
    return this.identifier ? trimmed.replace(/{identifier}/, this.identifier) : this.report.title;
  }

  get aggregationKeys(): (keyof ReportingData['aggregations'])[] {
    return Object.keys(this.data.aggregations) as (keyof ReportingData['aggregations'])[];
  }

  legendData: any = {};
  subtitle: string = T('% of all cores');
  altTitle = '';
  altSubtitle = '';
  widgetColorCssVar = 'var(--primary)';
  isActive = true;

  currentStartDate: number;// as seconds from Unix Epoch
  currentEndDate: number;// as seconds from Unix Epoch
  timeZoomIndex = 4;

  timezone: string;

  stepForwardDisabled = true;

  private _zoomInDisabled = false;
  get zoomInDisabled(): boolean {
    return this.timeZoomIndex >= (this.zoomLevels.length - 1);
  }
  _zoomOutDisabled = false;
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
  private _dataRcvd = false;
  get dataRcvd(): boolean {
    return this._dataRcvd;
  }
  set dataRcvd(val) {
    this._dataRcvd = val;
    if (val) {
      this.loader = false;
    }
  }

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

  constructor(
    public router: Router,
    public translate: TranslateService,
    private reportsService: ReportsService,
    private ws: WebSocketService,
    protected localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
    private dialog: DialogService,
  ) {
    super(translate);

    this.core.register({ observerClass: this, eventName: 'ReportData-' + this.chartId }).pipe(
      untilDestroyed(this),
    ).subscribe((evt: CoreEvent) => {
      this.data = evt.data;
      this.handleError(evt);
    });

    this.core.register({ observerClass: this, eventName: 'LegendEvent-' + this.chartId }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const clone = { ...evt.data };
      clone.xHTML = this.formatTime(evt.data.xHTML);
      this.legendData = clone;
    });

    this.core.register({ observerClass: this, eventName: 'ThemeData' }).pipe(untilDestroyed(this)).subscribe((evt: ThemeDataEvent) => {
      this.chartColors = this.processThemeColors(evt.data);
    });

    this.core.register({ observerClass: this, eventName: 'ThemeChanged' }).pipe(untilDestroyed(this)).subscribe((evt: ThemeChangedEvent) => {
      this.chartColors = this.processThemeColors(evt.data);
    });

    this.core.emit({ name: 'ThemeDataRequest', sender: this });

    this.sysGeneralService.getGeneralConfig$.pipe(
      untilDestroyed(this),
    ).subscribe((res) => this.timezone = res.timezone);
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

  // TODO: Helps with template type checking. To be removed when 'strict' checks are enabled.
  aggregationKey(key: keyof ReportingData['aggregations']): keyof ReportingData['aggregations'] {
    return key;
  }

  private async setupData(changes: SimpleChanges): Promise<void> {
    const zoom = this.zoomLevels[this.timeZoomIndex];
    const rrdOptions = await this.convertTimespan(zoom.timespan);
    const identifier = changes.report.currentValue.identifiers ? changes.report.currentValue.identifiers[0] : null;
    this.fetchReportData(rrdOptions, changes.report.currentValue, identifier);
  }

  private processThemeColors(theme: Theme): string[] {
    return theme.accentColors.map((color) => (theme as any)[color]);
  }

  setChartInteractive(value: boolean): void {
    this.isActive = value;
  }

  async timeZoomIn(): Promise<void> {
    // more detail
    const max = 4;
    if (this.timeZoomIndex == max) { return; }
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
    if (this.timeZoomIndex == min) { return; }
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

    const now = await this.reportsService.getServerTime();

    let startDate: Date;
    let endDate: Date;
    if (direction == 'backward' && !currentDate) {
      endDate = now;
    } else if (direction == 'backward' && currentDate) {
      endDate = new Date(currentDate);
    } else if (direction == 'forward' && currentDate) {
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

    if (direction == 'backward') {
      const subOptions: Duration = {};
      subOptions[durationUnit] = value;
      startDate = sub(endDate, subOptions);
    } else if (direction == 'forward') {
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
    if (evt.data?.name === 'FetchingError'
      && [
        ReportingDatabaseError.FailedExport,
        ReportingDatabaseError.InvalidTimestamp,
      ].includes(evt.data?.data?.error)
    ) {
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
