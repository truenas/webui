import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  combineLatest, map, Subscription, switchMap, tap,
} from 'rxjs';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { LogsDetailsDialogComponent } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ShellService } from 'app/services/shell.service';
import { WebSocketService } from 'app/services/ws.service';

interface PodLogEvent {
  data: string;
  timestamp: string;
  msg?: string;
  collection?: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-pod-logs',
  templateUrl: './pod-logs.component.html',
  styleUrls: ['./pod-logs.component.scss'],
  providers: [ShellService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodLogsComponent implements OnInit {
  @ViewChild('logContainer', { static: true }) logContainer: ElementRef<HTMLElement>;

  fontSize = 14;
  appName: string;
  containerId: string;
  podLogSubName = '';
  isLoadingPodLogs = false;
  defaultTailLines = 500;

  private podLogsChangedListener: Subscription;
  podLogs: PodLogEvent[] = [];

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected download: DownloadService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
      untilDestroyed(this),
    ).subscribe(([params, parentParams]) => {
      this.appName = parentParams.appId as string;
      this.containerId = params.containerId as string;

      this.reconnect();
    });
  }

  // subscribe pod log for selected app, pod and container.
  reconnect(): void {
    if (this.podLogsChangedListener && !this.podLogsChangedListener.closed) {
      this.podLogsChangedListener.unsubscribe();
    }

    this.podLogsChangedListener = this.matDialog.open(LogsDetailsDialogComponent, { width: '400px' }).afterClosed().pipe(
      tap((details: LogsDetailsDialogComponent['form']['value']) => {
        this.podLogSubName = `app.container_log_follow: ${JSON.stringify({
          app_name: this.appName,
          container_id: this.containerId,
          tail_lines: details.tail_lines || this.defaultTailLines,
        })}`;

        this.podLogs = [];
        this.isLoadingPodLogs = true;
      }),
      switchMap(() => this.ws.subscribeToLogs(this.podLogSubName)),
      map((apiEvent) => apiEvent.fields),
      untilDestroyed(this),
    ).subscribe({
      next: (podLog: PodLogEvent) => {
        this.isLoadingPodLogs = false;

        if (podLog && podLog.msg !== 'nosub') {
          this.podLogs.push(podLog);
          this.scrollToBottom();
        }

        this.cdr.markForCheck();
      },
      error: (error: WebSocketError) => {
        this.isLoadingPodLogs = false;
        if (error.reason) {
          this.dialogService.error(this.errorHandler.parseError(error));
        }
        this.cdr.markForCheck();
      },
    });
  }

  scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch (err: unknown) {

    }
  }

  onFontSizeChanged(newSize: number): void {
    this.fontSize = newSize;
  }

  onDownloadLogs(): void {
    // TODO: download logs
  }

  // downloadLogs(formValue: LogsDialogFormValue): void {
  //   const appName = formValue.apps;
  //   const podName = formValue.pods;
  //   const containerName = formValue.containers;
  //   const tailLines = formValue.tail_lines;

  //   this.dialogService.closeAllDialogs();

  //   const fileName = `${appName}_${podName}_${containerName}.log`;
  //   const mimetype = 'application/octet-stream';
  //   this.ws.call(
  //     'core.download',
  //     [
  //       'chart.release.pod_logs',
  //       [appName, { pod_name: podName, container_name: containerName, tail_lines: tailLines }],
  //       fileName,
  //     ],
  //   ).pipe(
  //     this.loader.withLoader(),
  //     this.errorHandler.catchError(),
  //     untilDestroyed(this),
  //   ).subscribe((download) => {
  //     const [, url] = download;
  //     this.download.streamDownloadFile(url, fileName, mimetype)
  //       .pipe(untilDestroyed(this))
  //       .subscribe({
  //         next: (file: Blob) => {
  //           if (download !== null) {
  //             this.download.downloadBlob(file, fileName);
  //           }
  //         },
  //         error: (error: HttpErrorResponse) => {
  //           this.dialogService.error(this.errorHandler.parseHttpError(error));
  //         },
  //       });
  //   });
  // }
}
