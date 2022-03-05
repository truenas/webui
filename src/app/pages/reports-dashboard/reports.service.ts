import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CoreEvent } from 'app/interfaces/events';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { WebSocketService } from 'app/services/ws.service';

/*
 * This service acts as a proxy between middleware/web worker
 * and reports page components.
 * */

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: any;
  options?: any[]; // Function parameters
}

export enum ReportingDatabaseError {
  FailedExport = 22,
  InvalidTimestamp = 206,
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService implements OnDestroy {
  private reportsUtils: Worker;

  constructor(
    private ws: WebSocketService,
    protected http: HttpClient,
    private core: CoreService,
  ) {
    this.reportsUtils = new Worker(new URL('./reports-utils.worker', import.meta.url), { type: 'module' });

    this.core.register({ observerClass: this, eventName: 'ReportDataRequest' }).subscribe((evt: CoreEvent) => {
      this.ws.call('reporting.get_data', [[evt.data.params], evt.data.timeFrame]).subscribe((reportingData) => {
        let res;

        // If requested, we truncate trailing null values
        if (evt.data.truncate) {
          const truncated = this.truncateData(reportingData[0].data);
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

        // We average out cputemps for v11.3.
        // Move this to backend for 12.
        if (evt.data.report.name === 'cputemp') {
          // Do a complete replacement instead...
          const repl = [{
            command: 'avgCpuTempReport',
            input: res[0],
          }];

          this.reportsUtils.postMessage({ name: 'ProcessCommandsAsReportData', data: repl, sender: evt.sender.chartId });
        } else {
          this.reportsUtils.postMessage({ name: 'ProcessCommandsAsReportData', data: commands, sender: evt.sender.chartId });
        }
      }, (err: WebsocketError) => {
        this.reportsUtils.postMessage({ name: 'FetchingError', data: err, sender: evt.sender.chartId });
      });
    });

    this.reportsUtils.onmessage = ({ data }) => {
      if (data.name === 'ReportData') {
        this.core.emit({ name: 'ReportData-' + data.sender, data: data.data, sender: this });
      }
    };
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
    this.reportsUtils.terminate();
  }

  prepReport(): void {
    const pipeLine: Command[] = [
      {
        command: 'maxDecimals',
        input: 3.145679156,
        options: [3],
      },
    ];

    this.reportsUtils.postMessage({ name: 'ProcessCommands', data: pipeLine, sender: 'chartID' });
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

  getServerTime(): Observable<Date> {
    return this.ws.call('system.info')
      .pipe(map((systemInfo) => {
        const msToTrim = 60_000;
        return new Date(systemInfo.datetime.$date - msToTrim);
      }));
  }
}
