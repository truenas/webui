import {
  Component,
  Input,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  OnInit, Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { add, sub } from 'date-fns';
import {
  BehaviorSubject, Subscription, timer,
} from 'rxjs';
import {
  delay, distinctUntilChanged, filter, switchMap, throttleTime,
} from 'rxjs/operators';
import { toggleMenuDuration } from 'app/constants/toggle-menu-duration';
import { WINDOW } from 'app/helpers/window.helper';
import { LegendEvent, ReportDataEvent } from 'app/interfaces/events/reporting-events.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportStepDirection } from 'app/pages/reports-dashboard/enums/report-step-direction.enum';
import { ReportZoomLevel, zoomLevelLabels } from 'app/pages/reports-dashboard/enums/report-zoom-level.enum';
import {
  DateTime, LegendDataWithStackedTotalHtml, Report, FetchReportParams, TimeAxisData, TimeData,
} from 'app/pages/reports-dashboard/interfaces/report.interface';
import { refreshInterval } from 'app/pages/reports-dashboard/reports.constants';
import { ReportingDatabaseError } from 'app/pages/reports-dashboard/reports.service';
import { formatData, formatLegendSeries } from 'app/pages/reports-dashboard/utils/report.utils';
import { WebSocketService } from 'app/services/';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectTheme, waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent extends WidgetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() localControls?: boolean = true;
  @Input() dateFormat?: DateTime;
  @Input() report: Report;
  @Input() identifier?: string;
  @Input() isReversed?: boolean;
  @ViewChild(LineChartComponent, { static: false }) lineChart: LineChartComponent;

  updateReport$ = new BehaviorSubject<SimpleChanges>(null);
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
  currentStartDate: number;
  currentEndDate: number;
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

  constructor(
    public translate: TranslateService,
    private ws: WebSocketService,
    protected localeService: LocaleService,
    private dialog: DialogService,
    private core: CoreService,
    private store$: Store<AppState>,
    private themeService: ThemeService,
    @Inject(WINDOW) private window: Window,
  ) {
    super(translate);

    this.core.register({ observerClass: this, eventName: `ReportData-${this.chartId}` }).pipe(
      untilDestroyed(this),
    ).subscribe((evt: ReportDataEvent) => {
      this.data = formatData(evt.data);
      this.handleError(evt);
    });

    this.core.register({ observerClass: this, eventName: `LegendEvent-${this.chartId}` }).pipe(
      untilDestroyed(this),
    ).subscribe((evt: LegendEvent) => {
      const clone = { ...evt.data };
      clone.xHTML = this.formatTime(evt.data.xHTML);
      clone.series = formatLegendSeries(evt.data.series, this.data);
      this.legendData = clone as LegendDataWithStackedTotalHtml;
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
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((params) => {
      this.fetchReportData(params);
    });

    this.updateReport$.pipe(
      filter((changes) => Boolean(changes?.report)),
      throttleTime(100),
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
      const rrdOptions = this.convertTimespan(this.currentZoomLevel);
      this.currentStartDate = rrdOptions.start;
      this.currentEndDate = rrdOptions.end;

      const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
      this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
    });
  }

  ngOnInit(): void {
    const { start, end } = this.convertTimespan(this.currentZoomLevel);
    this.currentStartDate = start;
    this.currentEndDate = end;
    this.stepForwardDisabled = true;

    if (!this.isReady) {
      setTimeout(() => {
        this.isReady = true;
      }, 1000);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.report?.firstChange) {
      this.updateReport$.next(changes);
    } else if (changes.report.previousValue && !this.isReady) {
      this.updateReport$.next(changes);
    } else if (changes.report.previousValue.title !== changes.report.currentValue.title) {
      this.updateReport$.next(changes);
    }
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  formatTime(stamp: string): string {
    const parsed = Date.parse(stamp);
    const result = this.localeService.formatDateTimeWithNoTz(new Date(parsed));
    return result.toLowerCase() !== 'invalid date' ? result : null;
  }

  setChartInteractive(value: boolean): void {
    this.isActive = value;
  }

  timeZoomReset(): void {
    this.zoomLevelIndex = this.zoomLevelMax;
    const rrdOptions = this.convertTimespan(this.currentZoomLevel);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  timeZoomIn(): void {
    // more detail
    if (this.zoomLevelIndex === this.zoomLevelMax) {
      return;
    }
    this.zoomLevelIndex += 1;
    const rrdOptions = this.convertTimespan(this.currentZoomLevel);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  timeZoomOut(): void {
    // less detail
    if (this.zoomLevelIndex === this.zoomLevelMin) {
      return;
    }
    this.zoomLevelIndex -= 1;
    const rrdOptions = this.convertTimespan(this.currentZoomLevel);
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  stepBack(): void {
    if (this.stepBackDisabled) {
      return;
    }

    const rrdOptions = this.convertTimespan(
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

    const rrdOptions = this.convertTimespan(
      this.currentZoomLevel,
      ReportStepDirection.Forward,
      this.currentEndDate,
    );
    this.currentStartDate = rrdOptions.start;
    this.currentEndDate = rrdOptions.end;

    const identifier = this.report.identifiers ? this.report.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: this.report });
  }

  // Convert timespan to start/end options for RRDTool
  convertTimespan(
    timespan: ReportZoomLevel,
    direction = ReportStepDirection.Backward,
    currentDate?: number,
  ): TimeData {
    let durationUnit: keyof Duration;
    let value: number;

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

    switch (timespan) {
      case ReportZoomLevel.HalfYear:
        durationUnit = 'months';
        value = 5;
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

    if (direction === ReportStepDirection.Backward) {
      startDate = sub(endDate, { [durationUnit]: value });
    } else if (direction === ReportStepDirection.Forward) {
      endDate = add(startDate, { [durationUnit]: value });
    }

    // if endDate is in the future, reset with endDate to now
    if (endDate.getTime() >= now.getTime()) {
      endDate = new Date();
      startDate = sub(endDate, { [durationUnit]: value });
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

  fetchReportData(fetchParams: FetchReportParams): void {
    const { report, identifier, rrdOptions } = fetchParams;
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

  handleError(evt: ReportDataEvent): void {
    const err = evt.data.data as WebsocketError;
    if ((evt.data?.data as WebsocketError)?.error === ReportingDatabaseError.FailedExport) {
      this.report.errorConf = {
        type: EmptyType.Errors,
        title: this.translate.instant('Error getting chart data'),
        message: err.reason,
      };
    }
    if (evt.data?.name === 'FetchingError' && (evt.data?.data as WebsocketError)?.error === ReportingDatabaseError.InvalidTimestamp) {
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
              buttonMsg: this.translate.instant('Clear'),
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

  private applyChanges(changes: SimpleChanges): void {
    const rrdOptions = this.convertTimespan(this.currentZoomLevel);
    const identifier = changes.report.currentValue.identifiers ? changes.report.currentValue.identifiers[0] : null;
    this.fetchReport$.next({ rrdOptions, identifier, report: changes.report.currentValue });
  }
}
