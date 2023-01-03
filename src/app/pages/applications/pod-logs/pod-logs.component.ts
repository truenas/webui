import {
  AfterViewInit,
  Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Subscription } from 'rxjs';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  LogsDialogFormValue,
  PodSelectLogsDialogComponent,
} from 'app/pages/applications/dialogs/pod-select-logs/pod-select-logs-dialog.component';
import { DialogService, ShellService, WebSocketService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';
import { StorageService } from 'app/services/storage.service';

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
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class PodLogsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('logContainer', { static: true }) logContainer: ElementRef;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  fontSize = 14;
  chartReleaseName: string;
  podName: string;
  containerName: string;
  protected tailLines = 500;
  podLogSubscriptionId: string = null;
  podLogSubName = '';
  areLoadingPodLogs = false;

  private podLogsChangedListener: Subscription;
  podLogs: PodLogEvent[];

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected storageService: StorageService,
    private layoutService: LayoutService,
    private mdDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.chartReleaseName = params['rname'];
      this.podName = params['pname'];
      this.containerName = params['cname'];
      this.tailLines = params['tail_lines'];

      this.reconnect();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    if (this.podLogsChangedListener) {
      this.podLogsChangedListener.unsubscribe();
      this.ws.unsub(this.podLogSubName, this.podLogSubscriptionId);
    }
  }

  // subscribe pod log for selected app, pod and container.
  reconnect(): void {
    this.podLogs = [];
    this.areLoadingPodLogs = true;

    if (this.podLogsChangedListener) {
      this.podLogsChangedListener.unsubscribe();
      this.ws.unsub(this.podLogSubName, this.podLogSubscriptionId);
    }

    this.podLogSubName = `kubernetes.pod_log_follow:{"release_name":"${this.chartReleaseName}", "pod_name":"${this.podName}", "container_name":"${this.containerName}", "tail_lines": ${this.tailLines}}`;
    this.podLogSubscriptionId = UUID.UUID();
    this.podLogsChangedListener = this.ws.sub(this.podLogSubName, this.podLogSubscriptionId)
      .pipe(untilDestroyed(this)).subscribe({
        next: (res: PodLogEvent) => {
          this.areLoadingPodLogs = false;

          if (res) {
            this.podLogs.push(res);
            this.scrollToBottom();
          }
        },
        error: (error) => {
          this.dialogService.errorReport('Error', error.reason);
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
            return this.download(logsFormValueDialog);
          }
          return this.onChooseLogs(logsFormValueDialog);
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

    this.loader.open();
    const fileName = `${chartReleaseName}_${podName}_${containerName}.log`;
    const mimetype = 'application/octet-stream';
    this.ws.call(
      'core.download',
      [
        'chart.release.pod_logs',
        [chartReleaseName, { pod_name: podName, container_name: containerName, tail_lines: tailLines }],
        fileName,
      ],
    ).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.loader.close();
        const url = res[1];
        this.storageService.streamDownloadFile(url, fileName, mimetype)
          .pipe(untilDestroyed(this))
          .subscribe((file: Blob) => {
            if (res !== null) {
              this.storageService.downloadBlob(file, fileName);
            }
          });
      },
      error: (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
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
