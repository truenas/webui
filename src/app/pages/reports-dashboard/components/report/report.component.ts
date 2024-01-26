import { DOCUMENT } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  OnInit, Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { add, isToday, sub } from 'date-fns';
import _ from 'lodash';
import {
  BehaviorSubject, Subscription, timer,
} from 'rxjs';
import {
  delay, distinctUntilChanged, filter, skipWhile, switchMap, throttleTime,
} from 'rxjs/operators';
import { toggleMenuDuration } from 'app/constants/toggle-menu-duration';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ReportingData, ReportingDatabaseError } from 'app/interfaces/reporting.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportStepDirection } from 'app/pages/reports-dashboard/enums/report-step-direction.enum';
import { ReportZoomLevel, zoomLevelLabels } from 'app/pages/reports-dashboard/enums/report-zoom-level.enum';
import {
  DateTime, LegendDataWithStackedTotalHtml, Report, FetchReportParams, TimeAxisData, TimeData,
} from 'app/pages/reports-dashboard/interfaces/report.interface';
import { refreshInterval } from 'app/pages/reports-dashboard/reports.constants';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { formatData } from 'app/pages/reports-dashboard/utils/report.utils';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectTheme, waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent extends WidgetComponent implements OnInit, OnChanges {
  @Input() localControls?: boolean = true;
  @Input() dateFormat?: DateTime;
  @Input() report: Report;
  @Input() identifier?: string;
  @ViewChild(LineChartComponent, { static: false }) lineChart: LineChartComponent;

  updateReport$ = new BehaviorSubject<IxSimpleChanges<this>>(null);
  fetchReport$ = new BehaviorSubject<FetchReportParams>(null);
  autoRefreshTimer: Subscription;
  autoRefreshEnabled: boolean;
  isReady = false;
  data: ReportingData;
  chartId = `chart-${UUID.UUID()}`;
  chartColors: string[];
  legendData: LegendDataWithStackedTotalHtml = {} as LegendDataWithStackedTotalHtml;
  subtitle: string = this.translate.instant('% of all cores');
  isActive = true;
  stepForwardDisabled = true;
  stepBackDisabled = false;
  timezone: string;
  lastEndDateForCurrentZoomLevel = {
    '60m': null as number,
    '24h': null as number,
    '7d': null as number,
    '1M': null as number,
    '6M': null as number,
  };
  currentStartDate: number;
  currentEndDate: number;
  customZoom = false;
  zoomLevelMax = Object.keys(ReportZoomLevel).length - 1;
  zoomLevelMin = 0;
  zoomLevelIndex = this.zoomLevelMax;
  zoomLevels: TimeAxisData[] = [
    { timespan: ReportZoomLevel.HalfYear, timeformat: "%b '%y", culling: 6 },
    { timespan: ReportZoomLevel.Month, timeformat: 'Week %W', culling: 4 },
    { timespan: ReportZoomLevel.Week, timeformat: '%d %b', culling: 6 },
    { timespan: ReportZoomLevel.Day, timeformat: '%a %H:%M', culling: 4 },
    { timespan: ReportZoomLevel.Hour, timeformat: '%H:%M', culling: 6 },
  ];
  readonly zoomLevelLabels = zoomLevelLabels;

  get reportTitle(): string {
    const trimmed = this.report.title.replace(/[()]/g, '');
    return this.identifier ? trimmed.replace(/{identifier}/, this.identifier) : this.report.title;
  }

  get zoomInDisabled(): boolean {
    return this.zoomLevelIndex >= this.zoomLevelMax;
  }

  get zoomOutDisabled(): boolean {
    return this.zoomLevelIndex <= this.zoomLevelMin;
  }

  get currentZoomLevel(): ReportZoomLevel {
    return this.zoomLevels[this.zoomLevelIndex].timespan;
  }

  get isStacked(): boolean {
    return [
      ReportingGraphName.Cpu,
      ReportingGraphName.Processes,
      ReportingGraphName.Uptime,
      ReportingGraphName.Swap,
      ReportingGraphName.ZfsArcResult,
    ].includes(this.data?.name as ReportingGraphName);
  }

  get shouldShowTotal(): boolean {
    return [
      ReportingGraphName.ZfsArcResult,
      ReportingGraphName.Memory,
    ].includes(this.data?.name as ReportingGraphName);
  }

  constructor(
    public translate: TranslateService,
    private ws: WebSocketService,
    protected localeService: LocaleService,
    private dialog: DialogService,
    private store$: Store<AppState>,
    private themeService: ThemeService,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
    private reportsService: ReportsService,
  ) {
    super(translate);
    this.reportsService.legendEventEmitterObs$.pipe(untilDestroyed(this)).subscribe({
      next: (data: LegendDataWithStackedTotalHtml) => {
        const clone = { ...data };
        clone.xHTML = this.formatTime(data.x);
        this.legendData = clone as LegendDataWithStackedTotalHtml;
      },
    });

    this.store$.select(selectTheme).pipe(
      filter(Boolean),
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

    this.store$.pipe(
      waitForPreferences,
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.autoRefreshEnabled = preferences.autoRefreshReports;
      if (this.autoRefreshEnabled && !this.autoRefreshTimer) {
        this.initAutoRefresh();
      }
    });

    this.fetchReport$.pipe(
      filter((params) => !!params),
      throttleTime(100),
      skipWhile(() => this.document.hidden),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((params) => {
      this.fetchReportData(params);
    });

    this.updateReport$.pipe(
      filter((changes) => Boolean(changes?.report)),
      throttleTime(100),
      skipWhile(() => this.document.hidden),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((changes) => {
      this.applyChanges(changes);
    });
  }

  initAutoRefresh(): void {
    this.autoRefreshTimer = timer(2000, refreshInterval).pipe(
      filter(() => this.autoRefreshEnabled),
      untilDestroyed(this),
    ).subscribe(() => {
      const rrdOptions = this.convertTimeSpan(this.currentZoomLevel);
      this.currentStartDate = rrdOptions.start;
      this.currentEndDate = rrdOptions.end;

      const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
      this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
    });
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    const wasReportChanged = changes?.report?.firstChange
      || (changes.report.previousValue && !this.isReady)
      || (changes.report.previousValue.title !== changes.report.currentValue.title);

    if (wasReportChanged) {
      this.updateReport$.next(changes);
    }
  }

  ngOnInit(): void {
    const { start, end } = this.convertTimeSpan(this.currentZoomLevel);
    this.currentStartDate = start;
    this.currentEndDate = end;
    this.stepForwardDisabled = true;

    if (!this.isReady) {
      setTimeout(() => {
        this.isReady = true;
      }, 1000);
    }
  }

  formatTime(stamp: number): string {
    const result = this.localeService.formatDateTimeWithNoTz(new Date(stamp));
    return result.toLowerCase() !== 'invalid date' ? result : null;
  }

  onZoomChange(interval: number[]): void {
    const [startDate, endDate] = interval;
    this.currentStartDate = startDate;
    this.currentEndDate = endDate;
    this.customZoom = true;
  }

  setChartInteractive(value: boolean): void {
    this.isActive = value;
  }

  timeZoomReset(): void {
    this.zoomLevelIndex = this.zoomLevelMax;
    const rrdOptions = this.convertTimeSpan(this.currentZoomLevel);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    this.customZoom = false;
    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
    this.clearLastEndDateForCurrentZoomLevel();
  }

  clearLastEndDateForCurrentZoomLevel(): void {
    Object.keys(this.lastEndDateForCurrentZoomLevel).forEach((key: ReportZoomLevel) => {
      this.lastEndDateForCurrentZoomLevel[key] = null;
    });
  }

  timeZoomIn(): void {
    if (this.zoomLevelIndex === this.zoomLevelMax) {
      return;
    }

    this.lastEndDateForCurrentZoomLevel[this.currentZoomLevel] = this.currentEndDate;
    this.zoomLevelIndex += 1;

    let currentDate = (this.currentStartDate + this.currentEndDate) / 2;

    if (this.stepForwardDisabled || isToday(this.currentEndDate)) {
      currentDate = this.currentEndDate;
    }

    const rrdOptions = this.convertTimeSpan(this.currentZoomLevel, ReportStepDirection.Backward, currentDate);

    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    this.customZoom = false;
    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  timeZoomOut(): void {
    if (this.zoomLevelIndex === this.zoomLevelMin) {
      return;
    }
    this.zoomLevelIndex -= 1;

    const halfPeriodMilliseconds = this.getHalfPeriodMilliseconds();

    let currentDate = this.lastEndDateForCurrentZoomLevel[this.currentZoomLevel]
      || ((this.currentStartDate + this.currentEndDate) / 2) + halfPeriodMilliseconds;

    if (this.stepForwardDisabled || isToday(this.currentEndDate)) {
      currentDate = this.currentEndDate;
    }

    const rrdOptions = this.convertTimeSpan(this.currentZoomLevel, ReportStepDirection.Backward, currentDate);

    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;
    this.customZoom = false;
    this.lastEndDateForCurrentZoomLevel[this.currentZoomLevel] = null;
    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  stepBack(): void {
    if (this.stepBackDisabled) {
      return;
    }

    this.clearLastEndDateForCurrentZoomLevel();

    const rrdOptions = this.convertTimeSpan(
      this.currentZoomLevel,
      ReportStepDirection.Backward,
      this.currentStartDate,
    );
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  stepForward(): void {
    if (this.stepForwardDisabled) {
      return;
    }

    this.clearLastEndDateForCurrentZoomLevel();

    const rrdOptions = this.convertTimeSpan(
      this.currentZoomLevel,
      ReportStepDirection.Forward,
      this.currentEndDate,
    );
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  // Convert timespan to start/end options
  convertTimeSpan(
    timespan: ReportZoomLevel,
    direction = ReportStepDirection.Backward,
    currentDate?: number,
  ): TimeData {
    const duration = this.getTimespan(timespan);
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (direction === ReportStepDirection.Backward && !currentDate) {
      endDate = now;
    } else if (direction === ReportStepDirection.Backward && currentDate) {
      endDate = new Date(currentDate);
    } else if (direction === ReportStepDirection.Forward && currentDate) {
      startDate = new Date(currentDate);
    } else {
      throw new Error(
        'A current date parameter must be specified when stepping forward in time!\n direction specified was ' + direction,
      );
    }

    if (direction === ReportStepDirection.Backward) {
      startDate = sub(endDate, duration);
    } else if (direction === ReportStepDirection.Forward) {
      endDate = add(startDate, duration);
    }

    // if endDate is in the future, reset with endDate to now
    if (endDate.getTime() >= now.getTime()) {
      endDate = now;
      startDate = sub(endDate, duration);
      this.stepForwardDisabled = true;
    } else {
      this.stepForwardDisabled = false;
    }

    if (startDate.getFullYear() <= 1999) {
      this.stepBackDisabled = true;
    } else {
      this.stepBackDisabled = false;
    }

    return {
      start: startDate.getTime(),
      end: endDate.getTime(),
      step: '10',
    };
  }

  getTimespan(zoomLevel: ReportZoomLevel): Record<string, number> {
    let durationUnit: keyof Duration;
    let value: number;

    switch (zoomLevel) {
      case ReportZoomLevel.HalfYear:
        durationUnit = 'months';
        value = 6;
        break;
      case ReportZoomLevel.Month:
        durationUnit = 'months';
        value = 1;
        break;
      case ReportZoomLevel.Week:
        durationUnit = 'days';
        value = 7;
        break;
      case ReportZoomLevel.Day:
        durationUnit = 'hours';
        value = 24;
        break;
      case ReportZoomLevel.Hour:
        durationUnit = 'minutes';
        value = 60;
        break;
    }
    return { [durationUnit]: value };
  }

  fetchReportData(fetchParams: FetchReportParams): void {
    const { report, identifier, rrdOptions } = fetchParams;
    // Report options
    const params = identifier ? { name: report.name, identifier } : { name: report.name };

    // Time scale options
    const start = Math.floor(rrdOptions.start / 1000);
    const end = Math.floor(rrdOptions.end / 1000);
    const timeFrame = { start, end };

    this.reportsService.getNetData({
      report,
      params,
      timeFrame,
      truncate: this.stepForwardDisabled,
    }).pipe(
      skipWhile(() => this.document.hidden),
      untilDestroyed(this),
    ).subscribe({
      next: (event) => {
        this.data = formatData(_.cloneDeep(event));
      },
      error: (err: WebSocketError) => {
        this.handleError(err);
      },
    });
  }

  handleError(err: WebSocketError): void {
    if (err?.error === (ReportingDatabaseError.FailedExport as number)) {
      this.report.errorConf = {
        type: EmptyType.Errors,
        title: this.translate.instant('Error getting chart data'),
        message: err.reason,
      };
    }
    if (err?.error === (ReportingDatabaseError.InvalidTimestamp as number)) {
      this.report.errorConf = {
        type: EmptyType.Errors,
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
              buttonText: this.translate.instant('Clear'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.ws.call('reporting.clear')),
              untilDestroyed(this),
            ).subscribe(() => {
              this.window.location.reload();
            });
          },
        },
      };
    }
  }

  private applyChanges(changes: IxSimpleChanges<this>): void {
    const rrdOptions = this.convertTimeSpan(this.currentZoomLevel);
    const identifier = changes.report.currentValue.identifiers ? changes.report.currentValue.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: changes.report.currentValue });
  }

  private getHalfPeriodMilliseconds(): number {
    switch (this.currentZoomLevel) {
      case ReportZoomLevel.Hour:
        return (1 * 60 * 60 * 1000) / 2;
      case ReportZoomLevel.Day:
        return (1 * 24 * 60 * 60 * 1000) / 2;
      case ReportZoomLevel.Week:
        return (7 * 24 * 60 * 60 * 1000) / 2;
      case ReportZoomLevel.Month:
        return (30 * 24 * 60 * 60 * 1000) / 2;
      case ReportZoomLevel.HalfYear:
        return (365 * 24 * 60 * 60 * 1000) / 2;
      default:
        return 0;
    }
  }
}
