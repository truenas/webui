import {
  Component, OnInit, OnDestroy, Type,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { Subject, Subscription } from 'rxjs';

import * as cronParser from 'cron-parser';
import { Moment } from 'moment';

import {
  WebSocketService,
  SystemGeneralService,
  DialogService,
  LanguageService,
  StorageService,
  UserService,
} from '../../../services';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { ModalService } from '../../../services/modal.service';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { T } from 'app/translate-marker';
import { KernelFormComponent } from './kernel-form/kernel-form.component';
import { SyslogFormComponent } from './syslog-form/syslog-form.component';
import { EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { InitshutdownFormComponent } from 'app/pages/system/advanced/initshutdown/initshutdown-form/initshutdown-form.component';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';
import { EmptyConfig } from '../../common/entity/entity-empty/entity-empty.component';
import { ConsoleFormComponent } from './console-form/console-form.component';
import { TunableFormComponent } from '../tunable/tunable-form/tunable-form.component';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { IsolatedGpuPcisFormComponent } from './isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { GpuDevice } from 'app/interfaces/gpu-device.interface';

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

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  providers: [DatePipe, UserService],
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  dataCards: any[] = [];
  configData: AdvancedConfig;
  refreshCardData: Subscription;
  refreshTable: Subscription;
  refreshForm: Subscription;
  refreshOnClose: Subscription;
  getAdvancedConfig: Subscription;
  getDatasetConfig: Subscription;
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
    type: EmptyType.no_page_data,
    title: T('No sysctls configured'),
    large: false,
    message: T('To configure sysctls, click the "Add" button.'),
  };
  isHA = false;
  formEvents: Subject<CoreEvent>;
  actionsConfig: any;
  protected dialogRef: MatDialogRef<EntityJobComponent>;

  cronTableConf: InputTableConf = {
    title: helptext_system_advanced.fieldset_cron,
    titleHref: '/system/cron',
    queryCall: 'cronjob.query',
    deleteCall: 'cronjob.delete',
    deleteMsg: {
      title: T('Cron Job'),
      key_props: ['user', 'command', 'description'],
    },
    emptyEntityLarge: false,
    parent: this,
    dataSourceHelper: this.cronDataSourceHelper,
    columns: [
      { name: T('Users'), prop: 'user', always_display: true },
      { name: T('Command'), prop: 'command' },
      { name: T('Description'), prop: 'description' },
      { name: T('Schedule'), prop: 'cron_schedule' },
      { name: T('Enabled'), prop: 'enabled' },
      { name: T('Next Run'), prop: 'next_run', hidden: true },
    ],
    add() {
      this.parent.doAdd('cron');
    },
    edit(row) {
      this.parent.doAdd('cron', row.id);
    },
  };

  initShutdownTableConf: InputTableConf = {
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
      { name: T('Command'), prop: 'command', hidden: true },
      { name: T('Script'), prop: 'script', hidden: true },
      { name: T('Description'), prop: 'comment' },
      { name: T('When'), prop: 'when' },
      { name: T('Enabled'), prop: 'enabled' },
      { name: T('Timeout'), prop: 'timeout', hidden: true },
    ],
    add() {
      this.parent.doAdd('initshutdown');
    },
    edit(row) {
      this.parent.doAdd('initshutdown', row.id);
    },
  };

  sysctlTableConf: InputTableConf = {
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
      this.parent.doAdd('sysctl');
    },
    edit(row) {
      this.parent.doAdd('sysctl', row.id);
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
    this.refreshCardData = this.sysGeneralService.refreshSysGeneral$.subscribe(() => {
      this.getDatasetData();
      this.getDataCardData();
    });

    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.refreshTables();
    });

    this.refreshOnClose = this.modalService.onClose$.subscribe(() => {
      this.refreshTables();
    });

    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });

    this.formEvents = new Subject();
    this.formEvents.subscribe((evt: CoreEvent) => {
      if (evt.data.save_debug) {
        this.saveDebug();
      }
    });

    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvents,
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

    this.ws.call('failover.licensed').subscribe((is_ha) => {
      this.isHA = is_ha;
    });
  }

  formatSyslogLevel(level: string): string {
    return helptext_system_advanced.sysloglevel.options.find((option) => option.value === level).label;
  }

  getDatasetData(): void {
    this.getDatasetConfig = this.ws.call('systemdataset.config').subscribe((config) => {
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
    this.getAdvancedConfig = this.ws.call('system.advanced.config').subscribe((advancedConfig: AdvancedConfig) => {
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

      this.ws.call('device.get_info', ['GPU']).subscribe((gpus: GpuDevice[]) => {
        const isolatedGpus = gpus.filter((gpu: GpuDevice) => advancedConfig.isolated_gpu_pci_ids.findIndex(
          (pciId: string) => pciId === gpu.addr.pci_slot,
        ) > -1).map((gpu: GpuDevice) => gpu.description).join(', ');
        this.dataCards.push({
          title: T('Isolated GPU Device(s)'),
          id: CardId.Gpus,
          items: [{ label: T('Isolated GPU Device(s)'), value: isolatedGpus }],
        });
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
        .Info(helptext_system_advanced.first_time.title, helptext_system_advanced.first_time.message)
        .subscribe(() => {
          if ([CardId.Console, CardId.Kernel, CardId.Syslog].includes(name)) {
            this.sysGeneralService.sendConfigData(this.configData);
          }

          this.modalService.open('slide-in-form', addComponent, id);
          this.isFirstTime = false;
        });
    } else {
      if ([CardId.Console, CardId.Kernel, CardId.Syslog].includes(name)) {
        this.sysGeneralService.sendConfigData(this.configData);
      }
      this.modalService.open('slide-in-form', addComponent, id);
    }
  }

  saveDebug(): void {
    this.ws.call('system.info', []).subscribe((res) => {
      let fileName = '';
      let mimeType = 'application/gzip';
      if (res) {
        const hostname = res.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        if (this.isHA) {
          mimeType = 'application/x-tar';
          fileName = `debug-${hostname}-${date}.tar`;
        } else {
          fileName = `debug-${hostname}-${date}.tgz`;
        }
      }
      this.dialog
        .confirm(
          helptext_system_advanced.dialog_generate_debug_title,
          helptext_system_advanced.dialog_generate_debug_message,
          true,
          helptext_system_advanced.dialog_button_ok,
        )
        .subscribe((ires: boolean) => {
          if (ires) {
            this.ws.call('core.download', ['system.debug', [], fileName]).subscribe(
              (res: any) => {
                const url = res[1];
                let failed = false;
                this.storage.streamDownloadFile(this.http, url, fileName, mimeType).subscribe(
                  (file) => {
                    this.storage.downloadBlob(file, fileName);
                  },
                  (err) => {
                    failed = true;
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
                if (!failed) {
                  let reported = false; // prevent error from popping up multiple times
                  this.dialogRef = this.mdDialog.open(EntityJobComponent, {
                    data: { title: T('Saving Debug') },
                    disableClose: true,
                  });
                  this.dialogRef.componentInstance.jobId = res[0];
                  this.dialogRef.componentInstance.wsshow();
                  this.dialogRef.componentInstance.success.subscribe(() => {
                    this.dialogRef.close();
                  });
                  this.dialogRef.componentInstance.failure.subscribe((save_debug_err: any) => {
                    this.dialogRef.close();
                    if (!reported) {
                      new EntityUtils().handleWSError(this, save_debug_err, this.dialog);
                      reported = true;
                    }
                  });
                }
              },
              (err) => {
                new EntityUtils().handleWSError(this, err, this.dialog);
              },
            );
          }
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
        value: { _date: Moment };
      }).value._date.fromNow();

      return job;
    });
  }

  ngOnDestroy(): void {
    this.refreshCardData.unsubscribe();
    this.refreshTable.unsubscribe();
    this.refreshForm.unsubscribe();
    this.refreshOnClose.unsubscribe();
    this.getDatasetConfig.unsubscribe();
    this.getAdvancedConfig.unsubscribe();
  }
}
