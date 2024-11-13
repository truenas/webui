import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  filter, map, Observable, shareReplay, BehaviorSubject, Subject, switchMap, tap,
} from 'rxjs';
import { take } from 'rxjs/operators';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { ReportTab, reportTypeLabels, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { LegendDataWithStackedTotalHtml, Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { convertAggregations, optimizeLegend } from 'app/pages/reports-dashboard/utils/report.utils';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private reportingGraphs$ = new BehaviorSubject<ReportingGraph[]>([]);
  private diskMetrics$ = new BehaviorSubject<Option[]>([]);
  private hasUps = false;
  private hasDiskTemperature = false;

  private legendEventEmitter$ = new Subject<LegendDataWithStackedTotalHtml>();
  readonly legendEventEmitterObs$ = this.legendEventEmitter$.asObservable();

  constructor(
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private ws: ApiService,
    private http: HttpClient,
    @Inject(WINDOW) private window: Window,
  ) {
    this.ws.call('reporting.netdata_graphs').subscribe((reportingGraphs) => {
      this.hasUps = reportingGraphs.some((graph) => graph.name.startsWith(ReportingGraphName.Ups));
      this.reportingGraphs$.next(reportingGraphs);
    });

    this.ws.call('disk.temperatures').subscribe((values) => {
      this.hasDiskTemperature = Boolean(Object.values(values).filter(Boolean).length);
    });
  }

  emitLegendEvent(data: LegendDataWithStackedTotalHtml): void {
    this.legendEventEmitter$.next(data);
  }

  getNetData(
    queryData: {
      report: Report;
      params: { name: string; identifier?: string };
      timeFrame: { start: number; end: number };
      truncate: boolean;
    },
  ): Observable<ReportingData> {
    return this.ws.call(
      'reporting.netdata_get_data',
      [[queryData.params], queryData.timeFrame],
    ).pipe(
      map((reportingData) => reportingData[0]),
      map((reportingData) => {
        if (queryData.truncate) {
          reportingData.data = this.truncateData(reportingData.data as number[][]);
        }

        return reportingData;
      }),
      map((reportingData) => optimizeLegend(reportingData)),
      map((reportingData) => convertAggregations(reportingData, queryData.report.vertical_label || '')),
    );
  }

  truncateData(data: number[][]): number[][] {
    let finished = false;
    let index = data.length - 1;
    do {
      // True only when all the values are null
      const isEmpty = !data[index].reduce((acc, i) => {
        // Treat zero as a value
        const value = i !== null ? 1 : i;
        return acc + value;
      });

      if (isEmpty) {
        data.splice(index, 1);
      } else {
        finished = true;
      }
      index--;
    } while (!finished && data.length > 0);

    return data;
  }

  getReportTabs(): ReportTab[] {
    return Array.from(reportTypeLabels)
      .filter(([value]) => {
        if (value === ReportType.Ups && !this.hasUps) {
          return false;
        }

        return true;
      })
      .map(([value, label]) => {
        return { value, label } as ReportTab;
      });
  }

  getDiskDevices(): Observable<Option[]> {
    return this.ws.call('disk.query').pipe(
      map((disks) => {
        return disks
          .filter((disk) => !disk.devname.includes('multipath'))
          .map((disk) => {
            const [value] = disk.devname.split(' ');
            return { label: disk.devname, value };
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  getReportGraphs(): Observable<ReportingGraph[]> {
    return this.reportingGraphs$.asObservable();
  }

  setDiskMetrics(options: Option[]): void {
    this.diskMetrics$.next(options);
  }

  getDiskMetrics(): Observable<Option[]> {
    return this.diskMetrics$.asObservable().pipe(
      map((options) => {
        if (!this.hasDiskTemperature) {
          return options.filter((option) => option.value !== 'disktemp');
        }

        return options;
      }),
    );
  }

  openNetdata(password: string): void {
    this.authService.user$.pipe(
      filter(Boolean),
      take(1),
      switchMap((user) => {
        const url = new URL(this.window.location.href);
        url.username = user.pw_name;
        url.password = password;
        url.pathname = '/netdata/';

        return this.http.get(url.toString(), { responseType: 'text' }).pipe(
          tap(() => this.window.open(url.pathname)),
        );
      }),
      this.errorHandler.catchError(),
    ).subscribe();
  }
}
