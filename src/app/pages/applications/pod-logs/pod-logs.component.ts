import {
  AfterViewInit,
  Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { DialogService, ShellService, WebSocketService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';
import { StorageService } from 'app/services/storage.service';

interface PodLogEvent {
  data: string;
  timestamp: string;
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

  constructor(
    private ws: WebSocketService,
    private appService: ApplicationsService,
    private dialogService: DialogService,
    public translate: TranslateService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected storageService: StorageService,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.chartReleaseName = params['rname'];
      this.podName = params['pname'];
      this.containerName = params['cname'];
      this.tailLines = params['tail_lines'];

      // Get app list
      this.appService.getChartReleaseNames().pipe(untilDestroyed(this)).subscribe((charts) => {
        charts.forEach((chart) => {
          this.apps.push(chart.name);
        });
      });

      // Get pod list for the selected app
      this.ws.call('chart.release.pod_logs_choices', [this.chartReleaseName]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.podDetails = res;

        const podDetail = res[this.podName];
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

    this.podLogSubName = `kubernetes.pod_log_follow:{"release_name":"${this.chartReleaseName}", "pod_name":"${this.podName}", "container_name":"${this.containerName}", "tail_lines": ${this.tailLines}}`;

    if (this.podLogsChangedListener) {
      this.podLogsChangedListener.unsubscribe();
      this.ws.unsub(this.podLogSubName, this.podLogSubscriptionId);
    }

    this.podLogSubscriptionId = UUID.UUID();
    this.podLogsChangedListener = this.ws.sub(this.podLogSubName, this.podLogSubscriptionId)
      .pipe(untilDestroyed(this)).subscribe((res: PodLogEvent) => {
        if (res) {
          this.podLogs.push(res);
          this.scrollToBottom();
        }
      });
  }

  // scroll to bottom, show last log.
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

  updateChooseLogsDialog(isDownload = false): void {
    let containerOptions: Option[] = [];

    if (this.podName && this.podDetails[this.podName]) {
      containerOptions = this.podDetails[this.podName].map((item) => ({
        label: item,
        value: item,
      }));
    }

    this.choosePod = {
      title: helptext.podLogs.title,
      fieldConfig: [{
        type: 'select',
        name: 'apps',
        placeholder: helptext.podLogs.chooseApp.placeholder,
        required: true,
        value: this.chartReleaseName,
        options: this.apps.map((item) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'select',
        name: 'pods',
        placeholder: helptext.podLogs.choosePod.placeholder,
        required: true,
        value: this.podName,
        options: Object.keys(this.podDetails).map((item) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'select',
        name: 'containers',
        placeholder: helptext.podLogs.chooseContainer.placeholder,
        required: true,
        value: this.containerName,
        options: containerOptions,
      }, {
        type: 'input',
        name: 'tail_lines',
        placeholder: helptext.podLogs.tailLines.placeholder,
        value: this.tailLines,
        required: true,
      }],
      saveButtonText: isDownload ? helptext.podLogs.downloadBtn : helptext.podLogs.chooseBtn,
      customSubmit: (entityDialog) => {
        if (isDownload) {
          this.download(entityDialog);
        } else {
          this.onChooseLogs(entityDialog);
        }
      },
      afterInit: (entityDialog) => this.afterLogsDialogInit(entityDialog),
    };
  }

  showChooseLogsDialog(isDownload = false): void {
    this.tempPodDetails = this.podDetails;
    this.updateChooseLogsDialog(isDownload);
    this.dialogService.dialogForm(this.choosePod, true);
  }

  // download log
  download(entityDialog: EntityDialogComponent): void {
    const chartReleaseName = entityDialog.formGroup.controls['apps'].value;
    const podName = entityDialog.formGroup.controls['pods'].value;
    const containerName = entityDialog.formGroup.controls['containers'].value;
    const tailLines = entityDialog.formGroup.controls['tail_lines'].value;

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

  onChooseLogs(entityDialog: EntityDialogComponent): void {
    this.chartReleaseName = entityDialog.formGroup.controls['apps'].value;
    this.podName = entityDialog.formGroup.controls['pods'].value;
    this.containerName = entityDialog.formGroup.controls['containers'].value;
    this.tailLines = entityDialog.formGroup.controls['tail_lines'].value;
    this.podDetails = this.tempPodDetails;

    this.reconnect();
    this.dialogService.closeAllDialogs();
  }

  afterLogsDialogInit(entityDialog: EntityDialogComponent): void {
    const podFc = _.find(entityDialog.fieldConfig, { name: 'pods' }) as FormSelectConfig;
    const containerFc = _.find(entityDialog.fieldConfig, { name: 'containers' }) as FormSelectConfig;

    // when app selection changed
    entityDialog.formGroup.controls['apps'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      podFc.options = [];
      containerFc.options = [];

      this.loader.open();
      this.ws.call('chart.release.pod_logs_choices', [value]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.loader.close();
        this.tempPodDetails = res;
        let podName;
        if (Object.keys(this.tempPodDetails).length > 0) {
          podName = Object.keys(this.tempPodDetails)[0];
        } else {
          podName = null;
        }

        podFc.options = Object.keys(this.tempPodDetails).map((item) => ({
          label: item,
          value: item,
        }));
        entityDialog.formGroup.controls['pods'].setValue(podName);
      });
    });

    // when pod selection changed
    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value) {
        const containers = this.tempPodDetails[value];

        containerFc.options = containers.map((item) => ({
          label: item,
          value: item,
        }));
        if (containers && containers.length > 0) {
          entityDialog.formGroup.controls['containers'].setValue(containers[0]);
        } else {
          entityDialog.formGroup.controls['containers'].setValue(null);
        }
      }
    });
  }
}
