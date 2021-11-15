import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, Type } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as cronParser from 'cron-parser';
import { merge, Subject } from 'rxjs';
import {
  filter, switchMap, take, tap,
} from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DeviceType } from 'app/enums/device-type.enum';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { Device } from 'app/interfaces/device.interface';
import { CoreEvent } from 'app/interfaces/events';
import { GlobalActionConfig } from 'app/interfaces/global-action.interface';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { AppTableAction, AppTableConfig } from 'app/pages/common/entity/table/table.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/initshutdown/init-shutdown-form/init-shutdown-form.component';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import {
  DialogService,
  LanguageService,
  StorageService,
  SystemGeneralService,
  UserService,
  WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { TunableFormComponent } from '../tunable/tunable-form/tunable-form.component';
import { ConsoleFormComponent } from './console-form/console-form.component';
import { IsolatedGpuPcisFormComponent } from './isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from './kernel-form/kernel-form.component';
import { SyslogFormComponent } from './syslog-form/syslog-form.component';

enum AdvancedCardId {
  Console = 'console',
  Syslog = 'syslog',
  Kernel = 'kernel',
  Cron = 'cron',
  InitShutdown = 'initshutdown',
  Sysctl = 'sysctl',
  SystemDatasetPool = 'systemdatasetpool',
  Gpus = 'gpus',
}

@UntilDestroy()
@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  providers: [DatePipe, UserService],
})
export class AdvancedSettingsComponent implements OnInit {
  dataCards: DataCard<AdvancedCardId>[] = [];
  configData: AdvancedConfig;
  syslog: boolean;
  systemDatasetPool: string;
  entityForm: EntityFormComponent;
  isFirstTime = true;

  isHA = false;
  formEvent$: Subject<CoreEvent>;
  actionsConfig: GlobalActionConfig;
  protected dialogRef: MatDialogRef<EntityJobComponent>;

  cronTableConf: AppTableConfig = {
    title: helptext_system_advanced.fieldset_cron,
    titleHref: '/system/cron',
    queryCall: 'cronjob.query',
    deleteCall: 'cronjob.delete',
    deleteMsg: {
      title: this.translate.instant('Cron Job'),
      key_props: ['user', 'command', 'description'],
    },
    getActions: (): AppTableAction<CronjobRow>[] => {
      return [
        {
          name: 'play',
          icon: 'play_arrow',
          matTooltip: this.translate.instant('Run job'),
          onClick: (row: CronjobRow): void => {
            this.dialog
              .confirm({ title: this.translate.instant('Run Now'), message: this.translate.instant('Run this job now?'), hideCheckBox: true })
              .pipe(
                filter((run) => !!run),
                switchMap(() => this.ws.call('cronjob.run', [row.id])),
              )
              .pipe(untilDestroyed(this)).subscribe(
                () => {
                  const message = row.enabled
                    ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
                    : this.translate.instant('This job will not run again until it is enabled.');
                  this.dialog.info(
                    this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
                    message,
                    '500px',
                    'info',
                    true,
                  );
                },
                (err: WebsocketError) => new EntityUtils().handleError(this, err),
              );
          },
        },
      ];
    },
    emptyEntityLarge: false,
    parent: this,
    dataSourceHelper: this.cronDataSourceHelper,
    columns: [
      { name: this.translate.instant('Users'), prop: 'user' },
      { name: this.translate.instant('Command'), prop: 'command' },
      { name: this.translate.instant('Description'), prop: 'description' },
      { name: this.translate.instant('Schedule'), prop: 'cron_schedule' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Next Run'), prop: 'next_run' },
    ],
    add: async () => {
      await this.onSettingsPressed(AdvancedCardId.Cron);
    },
    edit: async (row) => {
      await this.onSettingsPressed(AdvancedCardId.Cron, row.id);
    },
  };

  initShutdownTableConf: AppTableConfig = {
    title: helptext_system_advanced.fieldset_initshutdown,
    titleHref: '/system/initshutdown',
    queryCall: 'initshutdownscript.query',
    deleteCall: 'initshutdownscript.delete',
    deleteMsg: {
      title: this.translate.instant('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script'],
    },
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Type'), prop: 'type' },
      { name: this.translate.instant('Command'), prop: 'command' },
      { name: this.translate.instant('Script'), prop: 'script' },
      { name: this.translate.instant('Description'), prop: 'comment' },
      { name: this.translate.instant('When'), prop: 'when' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Timeout'), prop: 'timeout' },
    ],
    add: async () => {
      await this.showFirstTimeWarningIfNeeded();
      this.ixModal.open(InitShutdownFormComponent);
    },
    edit: async (script: InitShutdownScript) => {
      await this.showFirstTimeWarningIfNeeded();

      const modal = this.ixModal.open(InitShutdownFormComponent);
      modal.setScriptForEdit(script);
    },
  };

  sysctlTableConf: AppTableConfig = {
    title: helptext_system_advanced.fieldset_sysctl,
    queryCall: 'tunable.query',
    deleteCall: 'tunable.delete',
    deleteMsg: {
      title: helptext_system_advanced.fieldset_sysctl,
      key_props: ['var'],
    },
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Var'), prop: 'var' },
      { name: this.translate.instant('Value'), prop: 'value' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Description'), prop: 'comment' },
    ],
    add: async () => {
      await this.showFirstTimeWarningIfNeeded();
      this.ixModal.open(TunableFormComponent);
    },
    edit: async (tunable: Tunable) => {
      await this.showFirstTimeWarningIfNeeded();
      const dialog = this.ixModal.open(TunableFormComponent);
      dialog.setTunableForEdit(tunable);
    },
  };

  readonly CardId = AdvancedCardId;

  constructor(
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private language: LanguageService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private router: Router,
    private http: HttpClient,
    private storage: StorageService,
    public mdDialog: MatDialog,
    private core: CoreService,
    public datePipe: DatePipe,
    protected userService: UserService,
    private translate: TranslateService,
    private ixModal: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.getDatasetData();
    this.getDataCardData();
    this.sysGeneralService.refreshSysGeneral$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDatasetData();
      this.getDataCardData();
    });

    merge(
      this.modalService.refreshTable$,
      this.modalService.onClose$,
      this.ixModal.onClose$,
    ).pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTables();
    });

    this.formEvent$ = new Subject();
    this.formEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.save_debug) {
        this.saveDebug();
      }
    });

    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvent$,
        controls: [
          {
            name: 'save_debug',
            label: this.translate.instant('Save Debug'),
            type: 'button',
            value: 'click',
            color: 'primary',
          },
        ],
      },
    };

    this.actionsConfig = actionsConfig;

    this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
  }

  async showFirstTimeWarningIfNeeded(): Promise<unknown> {
    if (!this.isFirstTime) {
      return;
    }

    return this.dialog
      .info(helptext_system_advanced.first_time.title, helptext_system_advanced.first_time.message)
      .pipe(tap(() => this.isFirstTime = false))
      .toPromise();
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;

    this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((is_ha) => {
      this.isHA = is_ha;
    });
  }

  formatSyslogLevel(level: string): string {
    return helptext_system_advanced.sysloglevel.options.find((option) => option.value === level).label;
  }

  getDatasetData(): void {
    this.ws.call('systemdataset.config').pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config) {
        return;
      }

      this.syslog = config.syslog;
      this.systemDatasetPool = config.pool;
      this.modalService.refreshTable();
      this.getDataCardData();
    });
  }

  getDataCardData(): void {
    this.ws.call('system.advanced.config').pipe(untilDestroyed(this)).subscribe((advancedConfig) => {
      this.configData = advancedConfig;

      this.dataCards = [
        {
          title: helptext_system_advanced.fieldset_console,
          id: AdvancedCardId.Console,
          items: [
            {
              label: helptext_system_advanced.consolemenu_placeholder,
              value: advancedConfig.consolemenu ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.serialconsole_placeholder,
              value: advancedConfig.serialconsole ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.serialport_placeholder,
              value: advancedConfig.serialport ? advancedConfig.serialport : '–',
            },
            {
              label: helptext_system_advanced.serialspeed_placeholder,
              value: advancedConfig.serialspeed ? `${advancedConfig.serialspeed} bps` : '–',
            },
            {
              label: helptext_system_advanced.motd_placeholder,
              value: advancedConfig.motd ? advancedConfig.motd.toString() : '–',
            },
          ],
        },
        {
          title: helptext_system_advanced.fieldset_syslog,
          id: AdvancedCardId.Syslog,
          items: [
            {
              label: helptext_system_advanced.fqdn_placeholder,
              value: advancedConfig.fqdn_syslog ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.sysloglevel.placeholder,
              value: this.formatSyslogLevel(advancedConfig.sysloglevel),
            },
            {
              label: helptext_system_advanced.syslogserver.placeholder,
              value: advancedConfig.syslogserver ? advancedConfig.syslogserver : '–',
            },
            {
              label: helptext_system_advanced.syslog_transport.placeholder,
              value: advancedConfig.syslog_transport,
            },
            {
              label: helptext_system_advanced.system_dataset_placeholder,
              value: this.syslog ? helptext.enabled : helptext.disabled,
            },
          ],
        },
        {
          title: helptext_system_advanced.fieldset_kernel,
          id: AdvancedCardId.Kernel,
          items: [
            {
              label: helptext_system_advanced.autotune_placeholder,
              value: advancedConfig.autotune ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.debugkernel_placeholder,
              value: advancedConfig.debugkernel ? helptext.enabled : helptext.disabled,
            },
          ],
        },
        {
          id: AdvancedCardId.Cron,
          title: helptext_system_advanced.fieldset_cron,
          tableConf: this.cronTableConf,
        },
        {
          id: AdvancedCardId.InitShutdown,
          title: helptext_system_advanced.fieldset_initshutdown,
          tableConf: this.initShutdownTableConf,
        },
        {
          id: AdvancedCardId.Sysctl,
          title: helptext_system_advanced.fieldset_sysctl,
          tableConf: this.sysctlTableConf,
        },
        {
          id: AdvancedCardId.SystemDatasetPool,
          title: this.translate.instant('System Dataset Pool'),
          items: [
            {
              label: this.translate.instant('System Dataset Pool'),
              value: this.systemDatasetPool,
            },
          ],
        },
      ];

      this.ws.call('device.get_info', [DeviceType.Gpu]).pipe(untilDestroyed(this)).subscribe((gpus) => {
        const isolatedGpus = gpus.filter((gpu: Device) => advancedConfig.isolated_gpu_pci_ids.findIndex(
          (pciId: string) => pciId === gpu.addr.pci_slot,
        ) > -1).map((gpu: Device) => gpu.description).join(', ');
        const gpuCard = {
          title: this.translate.instant('Isolated GPU Device(s)'),
          id: AdvancedCardId.Gpus,
          items: [{ label: this.translate.instant('Isolated GPU Device(s)'), value: isolatedGpus }],
        } as DataCard<AdvancedCardId>;

        if (isolatedGpus.length == 0) {
          gpuCard.emptyConf = {
            type: EmptyType.NoPageData,
            title: this.translate.instant('No Isolated GPU Device(s) configured'),
            large: false,
            message: this.translate.instant('To configure Isolated GPU Device(s), click the "Configure" button.'),
          };
        }
        this.dataCards.push(gpuCard);
      });
    });
  }

  async onSettingsPressed(name: AdvancedCardId, id?: number): Promise<void> {
    let addComponent: Type<ConsoleFormComponent
    | KernelFormComponent
    | SyslogFormComponent
    | TunableFormComponent
    | CronFormComponent
    | SystemDatasetPoolComponent
    | IsolatedGpuPcisFormComponent
    >;

    switch (name) {
      case AdvancedCardId.Console:
        addComponent = ConsoleFormComponent;
        break;
      case AdvancedCardId.Kernel:
        addComponent = KernelFormComponent;
        break;
      case AdvancedCardId.Syslog:
        addComponent = SyslogFormComponent;
        break;
      case AdvancedCardId.Sysctl:
        addComponent = TunableFormComponent;
        break;
      case AdvancedCardId.Cron:
        addComponent = CronFormComponent;
        break;
      case AdvancedCardId.SystemDatasetPool:
        addComponent = SystemDatasetPoolComponent;
        break;
      case AdvancedCardId.Gpus:
        addComponent = IsolatedGpuPcisFormComponent;
        break;
      default:
        break;
    }

    await this.showFirstTimeWarningIfNeeded();
    if ([AdvancedCardId.Console, AdvancedCardId.Kernel].includes(name)) {
      this.sysGeneralService.sendConfigData(this.configData as any);
    }

    if ([AdvancedCardId.Kernel].includes(name)) {
      const modal = this.ixModal.open(KernelFormComponent);
      modal.setupForm(this.configData);
    } else if (
      [
        AdvancedCardId.Console,
        AdvancedCardId.Syslog,
        AdvancedCardId.Gpus,
        AdvancedCardId.SystemDatasetPool,
      ].includes(name)
    ) {
      this.ixModal.open(addComponent);
    } else {
      this.modalService.openInSlideIn(addComponent, id);
    }
  }

  saveDebug(): void {
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe((systemInfo) => {
      let fileName = '';
      let mimeType = 'application/gzip';
      if (systemInfo) {
        const hostname = systemInfo.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        if (this.isHA) {
          mimeType = 'application/x-tar';
          fileName = `debug-${hostname}-${date}.tar`;
        } else {
          fileName = `debug-${hostname}-${date}.tgz`;
        }
      }
      this.dialog
        .confirm({
          title: helptext_system_advanced.dialog_generate_debug_title,
          message: helptext_system_advanced.dialog_generate_debug_message,
          hideCheckBox: true,
          buttonMsg: helptext_system_advanced.dialog_button_ok,
        })
        .pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.ws.call('core.download', ['system.debug', [], fileName, true]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              const url = res[1];
              this.dialogRef = this.mdDialog.open(EntityJobComponent, {
                data: { title: this.translate.instant('Saving Debug') },
                disableClose: true,
              });
              this.dialogRef.componentInstance.jobId = res[0];
              this.dialogRef.componentInstance.wsshow();
              this.dialogRef.componentInstance.success.pipe(take(1), untilDestroyed(this)).subscribe(() => {
                this.dialogRef.close();
                this.storage.streamDownloadFile(this.http, url, fileName, mimeType)
                  .pipe(untilDestroyed(this)).subscribe(
                    (file) => {
                      this.storage.downloadBlob(file, fileName);
                    },
                    (err) => {
                      if (this.dialogRef) {
                        this.dialogRef.close();
                      }
                      if (err instanceof HttpErrorResponse) {
                        this.dialog.errorReport(
                          helptext_system_advanced.debug_download_failed_title,
                          helptext_system_advanced.debug_download_failed_message,
                          err.message,
                        );
                      } else {
                        this.dialog.errorReport(
                          helptext_system_advanced.debug_download_failed_title,
                          helptext_system_advanced.debug_download_failed_message,
                          err,
                        );
                      }
                    },
                  );
              });
              this.dialogRef.componentInstance.failure.pipe(take(1), untilDestroyed(this)).subscribe((saveDebugErr) => {
                this.dialogRef.close();
                new EntityUtils().handleWSError(this, saveDebugErr, this.dialog);
              });
            },
            (err) => {
              new EntityUtils().handleWSError(this, err, this.dialog);
            },
          );
        });
    });
  }

  refreshTables(): void {
    this.dataCards.forEach((card) => {
      if (card.tableConf?.tableComponent) {
        card.tableConf.tableComponent.getData();
      }
    });
  }

  cronDataSourceHelper(data: Cronjob[]): CronjobRow[] {
    return data.map((job) => {
      const schedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;
      return {
        ...job,
        cron_schedule: schedule,

        /* Weird type assertions are due to a type definition error in the cron-parser library */
        next_run: ((cronParser.parseExpression(schedule, { iterator: true }).next() as unknown) as {
          value: { _date: any };
        }).value._date.fromNow(),
      };
    });
  }
}
