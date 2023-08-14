import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { combineLatest, map, Subscription } from 'rxjs';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { LogsDialogFormValue, PodSelectLogsDialogComponent } from 'app/pages/apps/components/pod-select-logs/pod-select-logs-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ShellService } from 'app/services/shell.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

interface PodLogEvent {
  data: string;
  timestamp: string;
  msg?: string;
  collection?: string;
}

@UntilDestroy()
@Component({
  templateUrl: './pod-logs.component.html',
  styleUrls: ['./pod-logs.component.scss'],
  providers: [ShellService],
})
export class PodLogsComponent implements OnInit {
  @ViewChild('logContainer', { static: true }) logContainer: ElementRef<HTMLElement>;

  fontSize = 14;
  chartReleaseName: string;
  podName: string;
  containerName: string;
  protected tailLines = 500;
  podLogSubscriptionId: string = null;
  podLogSubName = '';
  isLoadingPodLogs = false;

  private podLogsChangedListener: Subscription;
  podLogs: PodLogEvent[];

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected storageService: StorageService,
    private errorHandler: ErrorHandlerService,
    private mdDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
      untilDestroyed(this),
    ).subscribe(([params, parentParams]) => {
      this.chartReleaseName = parentParams.appId as string;
      this.podName = params.podName as string;
      this.containerName = params.command as string;
      this.tailLines = params.tail_lines as number;

      this.reconnect();
    });
  }

  // subscribe pod log for selected app, pod and container.
  reconnect(): void {
    this.podLogs = [];
    this.isLoadingPodLogs = true;

    if (this.podLogsChangedListener && !this.podLogsChangedListener.closed) {
      this.podLogsChangedListener.unsubscribe();
    }

    this.podLogSubName = `kubernetes.pod_log_follow:{"release_name":"${this.chartReleaseName}", "pod_name":"${this.podName}", "container_name":"${this.containerName}", "tail_lines": ${this.tailLines}}`;
    this.podLogSubscriptionId = UUID.UUID();
    this.podLogsChangedListener = this.ws.subscribeToLogs(this.podLogSubName).pipe(
      map((apiEvent) => apiEvent.fields),
      untilDestroyed(this),
    ).subscribe({
      next: (podLog: PodLogEvent) => {
        this.isLoadingPodLogs = false;

        if (podLog && podLog.msg !== 'nosub') {
          this.podLogs.push(podLog);
          this.cdr.markForCheck();
          this.scrollToBottom();
        }
      },
      error: (error: WebsocketError) => {
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
    this.showChooseLogsDialog(true);
  }

  onReconnect(): void {
    this.showChooseLogsDialog(false);
  }

  showChooseLogsDialog(isDownload: boolean): void {
    this.mdDialog.open(PodSelectLogsDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: this.chartReleaseName,
        title: 'Choose log',
        customSubmit: (logsFormValueDialog: LogsDialogFormValue) => {
          if (isDownload) {
            this.download(logsFormValueDialog);
            return;
          }
          this.onChooseLogs(logsFormValueDialog);
        },
      },
    });
  }

  download(formValue: LogsDialogFormValue): void {
    const chartReleaseName = formValue.apps;
    const podName = formValue.pods;
    const containerName = formValue.containers;
    const tailLines = formValue.tail_lines;

    this.dialogService.closeAllDialogs();

    const fileName = `${chartReleaseName}_${podName}_${containerName}.log`;
    const mimetype = 'application/octet-stream';
    this.ws.call(
      'core.download',
      [
        'chart.release.pod_logs',
        [chartReleaseName, { pod_name: podName, container_name: containerName, tail_lines: tailLines }],
        fileName,
      ],
    ).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe((download) => {
      const [, url] = download;
      this.storageService.streamDownloadFile(url, fileName, mimetype)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (file: Blob) => {
            if (download !== null) {
              this.storageService.downloadBlob(file, fileName);
            }
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.errorHandler.parseHttpError(error));
          },
        });
    });
  }

  onChooseLogs(formValue: LogsDialogFormValue): void {
    this.chartReleaseName = formValue.apps;
    this.podName = formValue.pods;
    this.containerName = formValue.containers;
    this.tailLines = formValue.tail_lines;

    this.reconnect();
    this.dialogService.closeAllDialogs();
  }
}
