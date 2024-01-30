import { Injectable } from '@angular/core';
import {
  map, Observable, shareReplay, BehaviorSubject, Subject,
} from 'rxjs';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { Option } from 'app/interfaces/option.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { ReportTab, reportTypeLabels, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { LegendDataWithStackedTotalHtml, Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { convertAggregations, optimizeLegend } from 'app/pages/reports-dashboard/utils/report.utils';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private reportingGraphs$ = new BehaviorSubject<ReportingGraph[]>([]);
  private diskMetrics$ = new BehaviorSubject<Option[]>([]);
  private hasUps = false;
  private hasDiskTemperature = false;
  private hasTarget = false;
  private hasNfs = false;
  private hasPartitions = false;

  private legendEventEmitter$ = new Subject<LegendDataWithStackedTotalHtml>();
  readonly legendEventEmitterObs$ = this.legendEventEmitter$.asObservable();

  constructor(
    private ws: WebSocketService,
  ) {
    this.ws.call('reporting.netdata_graphs').subscribe((reportingGraphs) => {
      this.hasUps = reportingGraphs.some((graph) => graph.name.startsWith(ReportingGraphName.Ups));
      this.hasTarget = reportingGraphs.some((graph) => {
        return graph.name === ReportingGraphName.Target;
      });
      this.hasNfs = reportingGraphs.some((graph) => {
        return [
          ReportingGraphName.NfsStat,
          ReportingGraphName.NfsStatBytes,
        ].includes(graph.name);
      });
      this.hasPartitions = reportingGraphs.some((graph) => {
        return graph.name === ReportingGraphName.Partition;
      });
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

        if (value === ReportType.Target && !this.hasTarget) {
          return false;
        }

        if (value === ReportType.Partition && !this.hasPartitions) {
          return false;
        }

        if (value === ReportType.Nfs && !this.hasNfs) {
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
}
