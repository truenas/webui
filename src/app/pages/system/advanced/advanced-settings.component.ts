import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { GlobalActionConfig } from 'app/interfaces/global-action.interface';
import * as cronParser from 'cron-parser';
import { Subject } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DeviceType } from 'app/enums/device-type.enum';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Device } from 'app/interfaces/device.interface';
import { CoreEvent } from 'app/interfaces/events';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { AppTableAction, AppTableConfig } from 'app/pages/common/entity/table/table.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { InitshutdownFormComponent } from 'app/pages/system/advanced/initshutdown/initshutdown-form/initshutdown-form.component';
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
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { TunableFormComponent } from '../tunable/tunable-form/tunable-form.component';
import { ConsoleFormComponent } from './console-form/console-form.component';
import { IsolatedGpuPcisFormComponent } from './isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from './kernel-form/kernel-form.component';
import { SyslogFormComponent } from './syslog-form/syslog-form.component';

enum CardId {
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
  dataCards: DataCard[] = [];
  configData: AdvancedConfig;
  syslog: boolean;
  systemDatasetPool: string;
  entityForm: EntityFormComponent;
  isFirstTime = true;

  // Components included in this dashboard
  protected tunableFormComponent: TunableFormComponent;
  protected consoleFormComponent: ConsoleFormComponent;
  protected isolatedGpuPcisFormComponent: IsolatedGpuPcisFormComponent;
  protected kernelFormComponent: KernelFormComponent;
  protected syslogFormComponent: SyslogFormComponent;
  protected cronFormComponent: CronFormComponent;
  protected initShutdownFormComponent: InitshutdownFormComponent;
  protected systemDatasetPoolComponent: SystemDatasetPoolComponent;

  emptyPageConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    title: T('No sysctls configured'),
    large: false,
    message: T('To configure sysctls, click the "Add" button.'),
  };
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
      title: T('Cron Job'),
      key_props: ['user', 'command', 'description'],
    },
    getActions: (): AppTableAction[] => {
      return [
        {
          name: 'play',
          icon: 'play_arrow',
          matTooltip: T('Run job'),
          onClick: (row: any): void => {
            this.dialog
              .confirm({ title: T('Run Now'), message: T('Run this job now?'), hideCheckBox: true })
              .pipe(
                filter((run) => !!run),
                switchMap(() => this.ws.call('cronjob.run', [row.id])),
              )
              .pipe(untilDestroyed(this)).subscribe(
                () => {
                  const message = row.enabled == true
                    ? T('This job is scheduled to run again ' + row.next_run + '.')
                    : T('This job will not run again until it is enabled.');
                  this.dialog.info(
                    T('Job ' + row.description + ' Completed Successfully'),
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
      { name: T('Users'), prop: 'user' },
      { name: T('Command'), prop: 'command' },
      { name: T('Description'), prop: 'description' },
      { name: T('Schedule'), prop: 'cron_schedule' },
      { name: T('Enabled'), prop: 'enabled' },
      { name: T('Next Run'), prop: 'next_run' },
    ],
    add() {
      this.parent.onSettingsPressed(CardId.Cron);
    },
    edit(row) {
      this.parent.onSettingsPressed(CardId.Cron, row.id);
    },
  };

  initShutdownTableConf: AppTableConfig = {
    title: helptext_system_advanced.fieldset_initshutdown,
    titleHref: '/system/initshutdown',
    queryCall: 'initshutdownscript.query',
    deleteCall: 'initshutdownscript.delete',
    deleteMsg: {
      title: T('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script'],
    },
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: T('Type'), prop: 'type' },
      { name: T('Command'), prop: 'command' },
      { name: T('Script'), prop: 'script' },
      { name: T('Description'), prop: 'comment' },
      { name: T('When'), prop: 'when' },
      { name: T('Enabled'), prop: 'enabled' },
      { name: T('Timeout'), prop: 'timeout' },
    ],
    add() {
      this.parent.onSettingsPressed(CardId.InitShutdown);
    },
    edit(row) {
      this.parent.onSettingsPressed(CardId.InitShutdown, row.id);
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
      { name: T('Var'), prop: 'var' },
      { name: T('Value'), prop: 'value' },
      { name: T('Enabled'), prop: 'enabled' },
      { name: T('Description'), prop: 'comment' },
    ],
    add() {
      this.parent.onSettingsPressed(CardId.Sysctl);
    },
    edit(row) {
      this.parent.onSettingsPressed(CardId.Sysctl, row.id);
    },
  };

  readonly CardId = CardId;

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
  ) {}

  ngOnInit(): void {
    this.getDatasetData();
    this.getDataCardData();
    this.sysGeneralService.refreshSysGeneral$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDatasetData();
      this.getDataCardData();
    });

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTables();
    });

    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTables();
    });

    this.refreshForms();
    this.modalService.refreshForm$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshForms();
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
            label: T('Save Debug'),
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
          id: CardId.Console,
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
          id: CardId.Syslog,
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
          id: CardId.Kernel,
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
          id: CardId.Cron,
          title: helptext_system_advanced.fieldset_cron,
          tableConf: this.cronTableConf,
        },
        {
          id: CardId.InitShutdown,
          title: helptext_system_advanced.fieldset_initshutdown,
          tableConf: this.initShutdownTableConf,
        },
        {
          id: CardId.Sysctl,
          title: helptext_system_advanced.fieldset_sysctl,
          tableConf: this.sysctlTableConf,
        },
        {
          id: CardId.SystemDatasetPool,
          title: T('System Dataset Pool'),
          items: [
            {
              label: T('System Dataset Pool'),
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
          title: T('Isolated GPU Device(s)'),
          id: CardId.Gpus,
          items: [{ label: T('Isolated GPU Device(s)'), value: isolatedGpus }],
        } as DataCard;

        if (isolatedGpus.length == 0) {
          gpuCard.emptyConf = {
            type: EmptyType.NoPageData,
            title: T('No Isolated GPU Device(s) configured'),
            large: false,
            message: T('To configure Isolated GPU Device(s), click the "Configure" button.'),
          };
        }
        this.dataCards.push(gpuCard);
      });
    });
  }

  onSettingsPressed(name: CardId, id?: number): void {
    let addComponent: TunableFormComponent
    | ConsoleFormComponent
    | SyslogFormComponent
    | KernelFormComponent
    | CronFormComponent
    | InitshutdownFormComponent
    | IsolatedGpuPcisFormComponent
    | SystemDatasetPoolComponent;
    switch (name) {
      case CardId.Console:
        addComponent = this.consoleFormComponent;
        break;
      case CardId.Kernel:
        addComponent = this.kernelFormComponent;
        break;
      case CardId.Syslog:
        addComponent = this.syslogFormComponent;
        break;
      case CardId.Sysctl:
        addComponent = this.tunableFormComponent;
        break;
      case CardId.Cron:
        addComponent = this.cronFormComponent;
        break;
      case CardId.InitShutdown:
        addComponent = this.initShutdownFormComponent;
        break;
      case CardId.SystemDatasetPool:
        addComponent = this.systemDatasetPoolComponent;
        break;
      case CardId.Gpus:
        addComponent = this.isolatedGpuPcisFormComponent;
        break;
      default:
        break;
    }

    if (this.isFirstTime) {
      this.dialog
        .info(helptext_system_advanced.first_time.title, helptext_system_advanced.first_time.message)
        .pipe(untilDestroyed(this)).subscribe(() => {
          if ([CardId.Console, CardId.Kernel, CardId.Syslog].includes(name)) {
            this.sysGeneralService.sendConfigData(this.configData as any);
          }

          this.modalService.open('slide-in-form', addComponent, id);
          this.isFirstTime = false;
        });
    } else {
      if ([CardId.Console, CardId.Kernel, CardId.Syslog].includes(name)) {
        this.sysGeneralService.sendConfigData(this.configData as any);
      }
      this.modalService.open('slide-in-form', addComponent, id);
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
                data: { title: T('Saving Debug') },
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

  refreshForms(): void {
    this.tunableFormComponent = new TunableFormComponent(this.ws, this.sysGeneralService);
    this.consoleFormComponent = new ConsoleFormComponent(
      this.router,
      this.language,
      this.ws,
      this.dialog,
      this.loader,
      this.http,
      this.storage,
      this.sysGeneralService,
      this.modalService,
    );
    this.isolatedGpuPcisFormComponent = new IsolatedGpuPcisFormComponent(
      this.ws,
      this.loader,
      this.sysGeneralService,
      this.modalService,
    );
    this.kernelFormComponent = new KernelFormComponent(
      this.router,
      this.language,
      this.ws,
      this.dialog,
      this.loader,
      this.http,
      this.storage,
      this.sysGeneralService,
      this.modalService,
    );
    this.syslogFormComponent = new SyslogFormComponent(
      this.router,
      this.language,
      this.ws,
      this.dialog,
      this.loader,
      this.http,
      this.storage,
      this.sysGeneralService,
      this.modalService,
    );
    this.cronFormComponent = new CronFormComponent(this.userService, this.modalService);
    this.initShutdownFormComponent = new InitshutdownFormComponent(this.modalService);
    this.systemDatasetPoolComponent = new SystemDatasetPoolComponent(
      this.ws,
      this.loader,
      this.dialog,
      this.translate,
      this.modalService,
      this.sysGeneralService,
    );
  }

  cronDataSourceHelper(data: any[]): any[] {
    return data.map((job) => {
      job.cron_schedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      job.next_run = ((cronParser.parseExpression(job.cron_schedule, { iterator: true }).next() as unknown) as {
        value: { _date: any };
      }).value._date.fromNow();

      return job;
    });
  }
}
