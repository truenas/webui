import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { addSeconds } from 'date-fns';
import {
  map, Observable, shareReplay, BehaviorSubject, switchMap, interval,
} from 'rxjs';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { CoreEvent } from 'app/interfaces/events';
import { ReportDataRequestEvent } from 'app/interfaces/events/reporting-events.interface';
import { Option } from 'app/interfaces/option.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ReportComponent } from 'app/pages/reports-dashboard/components/report/report.component';
import { ReportTab, reportTypeLabels, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

/*
 * This service acts as a proxy between middleware/web worker
 * and reports page components.
 * */

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: unknown;
  options?: unknown[]; // Function parameters
}

export enum ReportingDatabaseError {
  FailedExport = 22,
  InvalidTimestamp = 206,
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService implements OnDestroy {
  serverTime: Date;
  private reportingGraphs$ = new BehaviorSubject<ReportingGraph[]>([]);
  private diskMetrics$ = new BehaviorSubject<Option[]>([]);
  private reportsUtils: Worker;
  private hasUps = false;
  private hasDiskTemperature = false;
  private hasTarget = false;
  private hasNfs = false;
  private hasPartitions = false;

  constructor(
    private ws: WebSocketService,
    private core: CoreService,
    private store$: Store<AppState>,
  ) {
    this.reportsUtils = new Worker(new URL('./reports-utils.worker', import.meta.url), { type: 'module' });

    this.core
      .register({
        observerClass: this,
        eventName: 'ReportDataRequest',
      })
      .subscribe((evt: ReportDataRequestEvent) => {
        const chartId = (evt.sender as ReportComponent).chartId;
        this.ws.call('reporting.netdata_get_data', [[evt.data.params], evt.data.timeFrame]).subscribe({
          next: (reportingData) => {
            const processedData = [...reportingData];

            const truncateTrailingNullValues = evt.data.truncate;
            if (truncateTrailingNullValues) {
              processedData[0].data = this.truncateData(reportingData[0].data as number[][]);
            }

            const commands = [
              {
                command: 'optimizeLegend',
                input: processedData[0],
              },
              {
                command: 'convertAggregations',
                input: '|',
                options: [evt.data.report.vertical_label || ''], // units
              },
            ];

            this.reportsUtils.postMessage({ name: 'ProcessCommandsAsReportData', data: commands, sender: chartId });
          },
          error: (err: WebsocketError) => {
            this.reportsUtils.postMessage({ name: 'FetchingError', data: err, sender: chartId });
          },
        });
      });

    this.reportsUtils.onmessage = ({ data }: { data: CoreEvent }) => {
      if (data.name === 'ReportData') {
        this.core.emit({ name: `ReportData-${String(data.sender)}`, data: data.data, sender: this });
      }
    };

    this.ws.call('reporting.netdata_graphs').subscribe((reportingGraphs) => {
      this.hasUps = reportingGraphs.some((graph) => graph.name === ReportingGraphName.Ups);
      this.hasTarget = reportingGraphs.some((graph) => graph.name === ReportingGraphName.Target);
      this.hasNfs = reportingGraphs.some((graph) => {
        return [ReportingGraphName.NfsStat, ReportingGraphName.NfsStatBytes].includes(graph.name as ReportingGraphName);
      });
      this.hasPartitions = reportingGraphs.some((graph) => graph.name === ReportingGraphName.Partition);
      this.reportingGraphs$.next(reportingGraphs);
    });

    this.ws.call('disk.temperatures').subscribe((values) => {
      this.hasDiskTemperature = Boolean(Object.values(values).filter(Boolean).length);
    });

    this.store$
      .pipe(
        waitForSystemInfo,
        map((systemInfo) => systemInfo.datetime.$date),
        switchMap((timestamp) => {
          this.serverTime = new Date(timestamp);
          return interval(1000);
        }),
      )
      .subscribe(() => {
        this.serverTime = addSeconds(this.serverTime, 1);
      });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
    this.reportsUtils.terminate();
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
          });
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
