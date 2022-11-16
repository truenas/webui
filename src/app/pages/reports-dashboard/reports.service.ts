import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { addSeconds, differenceInDays, differenceInSeconds } from 'date-fns';
import {
  map, Observable, shareReplay, BehaviorSubject,
} from 'rxjs';
import { ReportDataRequestEvent } from 'app/interfaces/events/reporting-events.interface';
import { Option } from 'app/interfaces/option.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ReportComponent } from 'app/pages/reports-dashboard/components/report/report.component';
import { getReportTypeLabels, ReportTab } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
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
  showTimeDiffWarning = false;
  private reportingGraphs$ = new BehaviorSubject([]);
  private diskMetrics$ = new BehaviorSubject([]);
  private reportsUtils: Worker;

  constructor(
    private ws: WebSocketService,
    private core: CoreService,
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {
    this.reportsUtils = new Worker(new URL('./reports-utils.worker', import.meta.url), { type: 'module' });

    this.core.register({
      observerClass: this,
      eventName: 'ReportDataRequest',
    }).subscribe((evt: ReportDataRequestEvent) => {
      const chartId = (evt.sender as ReportComponent).chartId;
      this.ws.call('reporting.get_data', [[evt.data.params], evt.data.timeFrame]).subscribe({
        next: (reportingData) => {
          let res;

          // If requested, we truncate trailing null values
          if (evt.data.truncate) {
            const truncated = this.truncateData(reportingData[0].data as number[][]);
            res = Object.assign([], reportingData);
            res[0].data = truncated;
          } else {
            res = reportingData;
          }

          const commands = [
            {
              command: 'optimizeLegend',
              input: res[0],
            },
            {
              command: 'convertAggregations',
              input: '|',
              options: [evt.data.report.vertical_label], // units
            },
          ];

          this.reportsUtils.postMessage({ name: 'ProcessCommandsAsReportData', data: commands, sender: chartId });
        },
        error: (err: WebsocketError) => {
          this.reportsUtils.postMessage({ name: 'FetchingError', data: err, sender: chartId });
        },
      });
    });

    this.reportsUtils.onmessage = ({ data }) => {
      if (data.name === 'ReportData') {
        this.core.emit({ name: `ReportData-${data.sender}`, data: data.data, sender: this });
      }
    };

    this.ws.call('reporting.graphs').subscribe((reportingGraphs) => {
      this.reportingGraphs$.next(reportingGraphs);
    });

    this.store$.pipe(waitForSystemInfo).subscribe((systemInfo) => {
      const now = Date.now();
      const datetime = systemInfo.datetime.$date;
      this.serverTime = new Date(datetime);
      const timeDiffInSeconds = differenceInSeconds(datetime, now);
      const timeDiffInDays = differenceInDays(datetime, now);
      if (timeDiffInSeconds > 300 || timeDiffInDays > 0) {
        this.showTimeDiffWarning = true;
      }

      setInterval(() => {
        this.serverTime = addSeconds(this.serverTime, 1);
      }, 1000);
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
    return Array.from(getReportTypeLabels(this.translate)).map(([value, label]) => {
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
    return this.diskMetrics$.asObservable();
  }
}
