import {
  Component, OnInit, OnDestroy, Type,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
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

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  providers: [DatePipe, UserService],
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  dataCards: any[] = [];
  configData: any;
  refreshCardData: Subscription;
  refreshTable: Subscription;
  refreshForm: Subscription;
  refreshOnClose: Subscription;
  getAdvancedConfig: Subscription;
  getDatasetConfig: Subscription;
  syslog: boolean;
  entityForm: any;
  isFirstTime = true;

  // Components included in this dashboard
  protected tunableFormComponent: TunableFormComponent;
  protected consoleFormComponent: ConsoleFormComponent;
  protected kernelFormComponent: KernelFormComponent;
  protected syslogFormComponent: SyslogFormComponent;
  protected cronFormComponent: CronFormComponent;
  protected initShutdownFormComponent: InitshutdownFormComponent;

  emptyPageConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    title: T('No sysctls configured'),
    large: false,
    message: T('To configure sysctls, click the "Add" button.'),
  };
  is_ha = false;
  formEvents: Subject<CoreEvent>;
  actionsConfig: any;
  protected dialogRef: any;

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

  afterInit(entityEdit: any): void {
    this.entityForm = entityEdit;
    console.log('afterInit::entityEdit', entityEdit);

    this.ws.call('failover.licensed').subscribe((is_ha) => {
      this.is_ha = is_ha;
    });
  }

  formatSyslogLevel(level: string): string {
    return helptext_system_advanced.sysloglevel.options.find((option) => option.value === level).label;
  }

  getDatasetData(): void {
    this.getDatasetConfig = this.ws.call('systemdataset.config').subscribe((res) => {
      if (res) {
        this.syslog = res.syslog;
        this.modalService.refreshTable();
        this.updateSyslogOnTable();
      }
    });
  }

  updateSyslogOnTable(): void {
    this.dataCards.forEach((card) => {
      if (card.id === 'syslog') {
        card.items.forEach((item: any) => {
          if (item.label === helptext_system_advanced.system_dataset_placeholder) {
            item.value = this.syslog ? helptext.enabled : helptext.disabled;
          }
        });
      }
    });
  }

  getDataCardData(): void {
    this.getAdvancedConfig = this.ws.call('system.advanced.config').subscribe((res) => {
      this.configData = res;
      this.dataCards = [
        {
          title: helptext_system_advanced.fieldset_console,
          id: 'console',
          items: [
            {
              label: helptext_system_advanced.consolemenu_placeholder,
              value: res.consolemenu ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.serialconsole_placeholder,
              value: res.serialconsole ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.serialport_placeholder,
              value: res.serialport ? res.serialport : '–',
            },
            {
              label: helptext_system_advanced.serialspeed_placeholder,
              value: res.serialspeed ? `${res.serialspeed} bps` : '–',
            },
            {
              label: helptext_system_advanced.motd_placeholder,
              value: res.motd ? res.motd.toString() : '–',
            },
          ],
        },
        {
          title: helptext_system_advanced.fieldset_syslog,
          id: 'syslog',
          items: [
            {
              label: helptext_system_advanced.fqdn_placeholder,
              value: res.fqdn_syslog ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.sysloglevel.placeholder,
              value: this.formatSyslogLevel(res.sysloglevel),
            },
            {
              label: helptext_system_advanced.syslogserver.placeholder,
              value: res.syslogserver ? res.syslogserver : '–',
            },
            {
              label: helptext_system_advanced.syslog_transport.placeholder,
              value: res.syslog_transport,
            },
            {
              label: helptext_system_advanced.system_dataset_placeholder,
              value: this.syslog ? helptext.enabled : helptext.disabled,
            },
          ],
        },
        {
          title: helptext_system_advanced.fieldset_kernel,
          id: 'kernel',
          items: [
            {
              label: helptext_system_advanced.autotune_placeholder,
              value: res.autotune ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext_system_advanced.debugkernel_placeholder,
              value: res.debugkernel ? helptext.enabled : helptext.disabled,
            },
          ],
        },
        {
          id: 'cron',
          title: helptext_system_advanced.fieldset_cron,
          tableConf: this.cronTableConf,
        },
        {
          id: 'initshutdown',
          title: helptext_system_advanced.fieldset_initshutdown,
          tableConf: this.initShutdownTableConf,
        },
        {
          id: 'sysctl',
          title: helptext_system_advanced.fieldset_sysctl,
          tableConf: this.sysctlTableConf,
        },
      ];
    });
  }

  doAdd(name: string, id?: number): void {
    let addComponent: TunableFormComponent
    | ConsoleFormComponent
    | SyslogFormComponent
    | KernelFormComponent
    | CronFormComponent
    | InitshutdownFormComponent;
    switch (name) {
      case 'console':
        addComponent = this.consoleFormComponent;
        break;
      case 'kernel':
        addComponent = this.kernelFormComponent;
        break;
      case 'syslog':
        addComponent = this.syslogFormComponent;
        break;
      case 'sysctl':
        addComponent = this.tunableFormComponent;
        break;
      case 'cron':
        addComponent = this.cronFormComponent;
        break;
      case 'initshutdown':
        addComponent = this.initShutdownFormComponent;
        break;
      default:
        break;
    }

    if (this.isFirstTime) {
      this.dialog
        .Info(helptext_system_advanced.first_time.title, helptext_system_advanced.first_time.message)
        .subscribe(() => {
          if (['console', 'kernel', 'syslog'].includes(name)) {
            this.sysGeneralService.sendConfigData(this.configData);
          }

          this.modalService.open('slide-in-form', addComponent, id);
          this.isFirstTime = false;
        });
    } else {
      if (['console', 'kernel', 'syslog'].includes(name)) {
        this.sysGeneralService.sendConfigData(this.configData);
      }
      this.modalService.open('slide-in-form', addComponent, id);
    }
  }

  saveDebug(): void {
    this.ws.call('system.info', []).subscribe((res) => {
      let fileName = '';
      let mimetype = 'application/gzip';
      if (res) {
        const hostname = res.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        if (this.is_ha) {
          mimetype = 'application/x-tar';
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
                this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(
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
