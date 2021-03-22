import { EmptyConfig } from './../../common/entity/entity-empty/entity-empty.component';
import { ConsoleFormComponent } from './console-form/console-form.component'
import { TunableFormComponent } from './../tunable/tunable-form/tunable-form.component'
import {
  Component,
  OnInit,
  OnDestroy,
  Injector,
  ApplicationRef,
} from '@angular/core'
import {
  WebSocketService,
  SystemGeneralService,
  DialogService,
  LanguageService,
  StorageService,
} from '../../../services'
import { CoreEvent, CoreService } from 'app/core/services/core.service'
import { LocaleService } from '../../../services/locale.service'
import { ModalService } from '../../../services/modal.service'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { helptext_system_general as helptext } from 'app/helptext/system/general'
import { helptext_system_advanced } from 'app/helptext/system/advanced'
import { AppLoaderService } from '../../../services/app-loader/app-loader.service'
import { Subject, Subscription } from 'rxjs'
import { T } from 'app/translate-marker'
import { KernelFormComponent } from './kernel-form/kernel-form.component'
import { SyslogFormComponent } from './syslog-form/syslog-form.component'
import { EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component'
import { EntityJobComponent } from 'app/pages/common/entity/entity-job';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  providers: [DatePipe]
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  dataCards = []
  sysctlTitle = helptext_system_advanced.fieldset_sysctl
  configData: any
  refreshCardData: Subscription
  displayedColumns: any
  dataSource: any[] = []
  refreshTable: Subscription
  getSysctlSubscription: Subscription
  getAdvancedConfig: Subscription
  getDatasetConfig: Subscription
  syslog: boolean
  entityForm: any
  isFirstTime = true

  // Components included in this dashboard
  protected tunableFormComponent = new TunableFormComponent(this.router, this.route, this.ws, this.injector, this.appRef, this.sysGeneralService)
  protected consoleFormComponent = new ConsoleFormComponent(this.router, this.language, this.ws, this.dialog, this.loader, this.http, this.storage, this.sysGeneralService, this.modalService)
  protected kernelFormComponent = new KernelFormComponent(this.router, this.language, this.ws, this.dialog, this.loader, this.http, this.storage, this.sysGeneralService, this.modalService)
  protected syslogFormComponent = new SyslogFormComponent(this.router, this.language, this.ws, this.dialog, this.loader, this.http, this.storage, this.sysGeneralService, this.modalService)
  
  public emptyPageConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    title: T('No sysctls configured'),
    large: false,
    message: T('To configure sysctls, click the "Add" button.')
  };
  public is_ha = false;
  public formEvents: Subject<CoreEvent>;
  public actionsConfig;
  protected dialogRef: any;
  

  constructor(
    private ws: WebSocketService,
    private localeService: LocaleService,
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
    private injector: Injector,
    private appRef: ApplicationRef,
    private route: ActivatedRoute,
    public datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.getDatasetData()
    this.getDataCardData()
    this.refreshCardData = this.sysGeneralService.refreshSysGeneral$.subscribe(() => {
      this.getDatasetData()
      this.getDataCardData()
    })
    this.getSysctlData()
    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.getSysctlData()
    })
    
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
            color: 'primary'
          }
        ]
      }
    };

    this.actionsConfig = actionsConfig;

    this.core.emit({name:"GlobalActions", data: actionsConfig, sender: this});
  }
  
  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    
    this.ws.call('failover.licensed').subscribe((is_ha) => {
      this.is_ha = is_ha;
    });
  }
  
  formatSyslogLevel(level: string): string {
    return helptext_system_advanced.sysloglevel.options.find(option => option.value === level).label;
  }
  
  getDatasetData() {
    this.getDatasetConfig = this.ws
      .call('systemdataset.config')
      .subscribe((res) => {
        if (res) {
          this.syslog = res.syslog;
          this.modalService.refreshTable()
          this.updateSyslogOnTable()
        }
      })
  }
  
  updateSyslogOnTable() {
    this.dataCards.forEach(card => {
      if (card.id === 'syslog') {
        card.items.forEach(item => {
          if (item.label === helptext_system_advanced.system_dataset_placeholder) {
            item.value = this.syslog ? helptext.enabled : helptext.disabled
          }
        })
      }
    })
  }

  getDataCardData() {
    this.getAdvancedConfig = this.ws.call('system.advanced.config').subscribe(
      (res) => {
        this.configData = res
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
        ]
      }
    )
  }

  doAdd(name: string, id?: number) {
    let addComponent
    switch (name) {
      case 'console':
        addComponent = this.consoleFormComponent
        break
      case 'sysctl':
        addComponent = id
          ? this.tunableFormComponent
          : new TunableFormComponent(this.router, this.route, this.ws, this.injector, this.appRef, this.sysGeneralService)
        break
      case 'kernel':
        addComponent = this.kernelFormComponent
        break
      case 'syslog':
        addComponent = this.syslogFormComponent
        break
      default:
        break
    }
    
    if (this.isFirstTime) {
      this.dialog.Info(T('Warning'), T('Changing Advanced settings can be dangerous when done incorrectly. Please use caution before saving.')).subscribe(() => {
        this.sysGeneralService.sendConfigData(this.configData)
        this.modalService.open('slide-in-form', addComponent, id)
        this.isFirstTime = false
      });
    } else {
      this.sysGeneralService.sendConfigData(this.configData)
      this.modalService.open('slide-in-form', addComponent, id)
    }
  }

  doSysctlEdit(variable: any) {
    this.doAdd('sysctl', variable.id)
  }

  doSysctlDelete(variable: any) {
    this.dialog
      .confirm(T('Variable'), `${T('Delete')} ${variable.var}?`, false, T('Delete'))
      .subscribe((res) => {
        if (res) {
          this.loader.open()
          this.ws.call('tunable.delete', [variable.id]).subscribe(
            () => {
              this.loader.close()
              this.getSysctlData()
            },
            (err) => {
              this.loader.close()
              this.dialog.errorReport('Error', err.reason, err.trace.formatted)
            }
          )
        }
      })
  }

  getSysctlData() {
    this.getSysctlSubscription = this.ws.call('tunable.query').subscribe((res) => {
      this.dataSource = res
      this.displayedColumns = ['var', 'value', 'enabled', 'comment', 'actions']
    })
  }
  
  saveDebug() {
    this.ws.call('system.info', []).subscribe((res) => {
      let fileName = "";
      let mimetype = 'application/gzip'; 
      if (res) {
        const hostname = res.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
        if (this.is_ha) {
          mimetype = 'application/x-tar';
          fileName = `debug-${hostname}-${date}.tar`;
        } else {
          fileName = `debug-${hostname}-${date}.tgz`;
        }
      }
      this.dialog.confirm(helptext_system_advanced.dialog_generate_debug_title, helptext_system_advanced.dialog_generate_debug_message, true, helptext_system_advanced.dialog_button_ok).subscribe((ires) => {
        if (ires) {
          this.ws.call('core.download', ['system.debug', [], fileName]).subscribe(
            (res) => {
              const url = res[1];
              let failed = false;
              this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
                this.storage.downloadBlob(file, fileName);
              }, err => {
                failed = true;
                if (this.dialogRef) {
                  this.dialogRef.close();
                }
                if(err instanceof HttpErrorResponse) {
                  this.dialog.errorReport(helptext_system_advanced.debug_download_failed_title, helptext_system_advanced.debug_download_failed_message, err.message);
                } else {
                  this.dialog.errorReport(helptext_system_advanced.debug_download_failed_title, helptext_system_advanced.debug_download_failed_message, err);
                }
              });
              if (!failed) {
                let reported = false; // prevent error from popping up multiple times
                this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { "title": T("Saving Debug") }, disableClose: true });
                this.dialogRef.componentInstance.jobId = res[0];
                this.dialogRef.componentInstance.wsshow();
                this.dialogRef.componentInstance.success.subscribe((save_debug) => {
                  this.dialogRef.close();
                });
                this.dialogRef.componentInstance.failure.subscribe((save_debug_err) => {
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
            });
        }
      })
    })
  }

  ngOnDestroy() {
    this.refreshCardData.unsubscribe()
    this.refreshTable.unsubscribe()
    this.getAdvancedConfig.unsubscribe()
    this.getSysctlSubscription.unsubscribe()
  }
}
