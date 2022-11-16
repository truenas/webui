import {
  AfterViewInit,
  Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { of, Subscription } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { PodSelectDialogComponent } from 'app/pages/applications/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/applications/enums/pod-select-dialog.enum';
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
  protected podDetails: Record<string, string[]>;
  protected tempPodDetails: Record<string, string[]>;
  protected apps: string[] = [];
  protected routeSuccess: string[] = ['apps'];
  podLogSubscriptionId: string = null;
  podLogSubName = '';

  choosePod: DialogFormConfiguration;
  private podLogsChangedListener: Subscription;
  podLogs: PodLogEvent[];
  podsOptions: Option[];
  containersOptions: Option[];

  constructor(
    private ws: WebSocketService,
    private appService: ApplicationsService,
    private dialogService: DialogService,
    public translate: TranslateService,
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

      this.appService.getChartReleaseNames().pipe(untilDestroyed(this)).subscribe((charts) => {
        charts.forEach((chart) => {
          this.apps.push(chart.name);
        });
      });

      this.ws.call('chart.release.pod_logs_choices', [this.chartReleaseName]).pipe(untilDestroyed(this)).subscribe((logsChoices) => {
        this.podDetails = { ...logsChoices };

        const podDetail = this.podDetails[this.podName];
        if (!podDetail) {
          this.dialogService.confirm({
            title: helptext.podLogs.nopod.title,
            message: helptext.podLogs.nopod.message,
            hideCheckBox: true,
            buttonMsg: this.translate.instant('Close'),
            hideCancel: true,
          });
        }
      });

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

    if (this.podLogsChangedListener) {
      this.podLogsChangedListener.unsubscribe();
      this.ws.unsub(this.podLogSubName, this.podLogSubscriptionId);
    }

    this.podLogSubName = `kubernetes.pod_log_follow:{"release_name":"${this.chartReleaseName}", "pod_name":"${this.podName}", "container_name":"${this.containerName}", "tail_lines": ${this.tailLines}}`;
    this.podLogSubscriptionId = UUID.UUID();
    this.podLogsChangedListener = this.ws.sub(this.podLogSubName, this.podLogSubscriptionId)
      .pipe(untilDestroyed(this)).subscribe((res: PodLogEvent) => {
        if (res.msg && res.collection) {
          this.dialogService.closeAllDialogs();
          this.dialogService.errorReport('Pod Connection', `${res.collection} ${res.msg}`);
        } else if (res) {
          this.podLogs.push(res);
          this.scrollToBottom();
        }
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

  getPodOptions(podDialog: PodSelectDialogComponent): void {
    podDialog.apps$ = of(this.apps.map((item) => ({
      label: item,
      value: item,
    })));

    if (this.podDetails && Object.keys(this.podDetails).length) {
      this.podsOptions = Object.keys(this.podDetails).map((item) => ({
        label: item,
        value: item,
      }));
      podDialog.pods$ = of(this.podsOptions);

      if (this.podName && this.podDetails[this.podName]) {
        this.containersOptions = this.podDetails[this.podName].map((item) => ({
          label: item,
          value: item,
        }));
        podDialog.containers$ = of(this.containersOptions);
      }
    } else {
      podDialog.hasPools = false;
    }
  }

  showChooseLogsDialog(isDownload = false): void {
    this.tempPodDetails = this.podDetails;
    this.mdDialog.open(PodSelectDialogComponent, {
      width: '50vw',
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        type: PodSelectDialogType.PodLogs,
        title: 'Choose log',
        afterDialogInit: (podSelectDialog: PodSelectDialogComponent) => this.afterLogsDialogInit(podSelectDialog),
        customSubmit: (podSelectDialog: PodSelectDialogComponent) => {
          if (isDownload) {
            return this.download(podSelectDialog);
          }
          return this.onChooseLogs(podSelectDialog);
        },
      },
    });
  }

  download(podDialog: PodSelectDialogComponent): void {
    const chartReleaseName = podDialog.form.controls.apps.value;
    const podName = podDialog.form.controls.pods.value;
    const containerName = podDialog.form.controls.containers.value;
    const tailLines = podDialog.form.controls.tail_lines.value;

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

  onChooseLogs(podDialog: PodSelectDialogComponent): void {
    this.chartReleaseName = podDialog.form.controls.apps.value;
    this.podName = podDialog.form.controls.pods.value;
    this.containerName = podDialog.form.controls.containers.value;
    this.tailLines = podDialog.form.controls.tail_lines.value;
    this.podDetails = this.tempPodDetails;

    this.reconnect();
    this.dialogService.closeAllDialogs();
  }

  afterLogsDialogInit(podDialog: PodSelectDialogComponent): void {
    this.getPodOptions(podDialog);
    podDialog.form.controls.apps.setValue(this.chartReleaseName);
    podDialog.form.controls.pods.setValue(this.podsOptions[0].value);
    podDialog.form.controls.containers.setValue(this.containersOptions[0].value);

    podDialog.form.controls.apps.valueChanges.pipe(untilDestroyed(this)).subscribe((appName) => {
      this.loader.open();
      this.ws.call('chart.release.pod_logs_choices', [appName])
        .pipe(untilDestroyed(this)).subscribe({
          next: (logsChoices) => {
            this.loader.close();
            this.tempPodDetails = { ...logsChoices };

            if (this.tempPodDetails && Object.keys(this.tempPodDetails).length) {
              const podOptions = Object.keys(this.tempPodDetails).map((item) => ({
                label: item,
                value: item,
              }));
              podDialog.pods$ = of(podOptions);
              podDialog.form.controls.pods.setValue(podOptions[0].value);
            } else {
              podDialog.pods$ = of(null);
              podDialog.form.controls.pods.setValue(null);
            }
          },
          error: (error) => {
            this.dialogService.closeAllDialogs();
            this.loader.close();
            new EntityUtils().handleWsError(this, error, this.dialogService);
          },
        });
    });

    podDialog.form.controls.pods.valueChanges.pipe(untilDestroyed(this)).subscribe((pod) => {
      if (pod) {
        const containers = this.tempPodDetails[pod];

        podDialog.containers$ = of(containers.map((item) => ({
          label: item,
          value: item,
        })));
        podDialog.form.controls.containers.setValue(containers[0]);
      } else {
        podDialog.containers$ = of(null);
        podDialog.form.controls.containers.setValue(null);
      }
    });
  }
}
