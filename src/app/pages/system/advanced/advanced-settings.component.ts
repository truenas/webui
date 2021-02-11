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
import { CoreService } from 'app/core/services/core.service'
import { LocaleService } from '../../../services/locale.service'
import { ModalService } from '../../../services/modal.service'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { helptext_system_general as helptext } from 'app/helptext/system/general'
import { helptext_system_advanced as helptext_advanced } from 'app/helptext/system/advanced'
import { AppLoaderService } from '../../../services/app-loader/app-loader.service'
import { Subscription } from 'rxjs'
import { T } from 'app/translate-marker'
import { KernelFormComponent } from './kernel-form/kernel-form.component'
import { SyslogFormComponent } from './syslog-form/syslog-form.component'
import { EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component'

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  dataCards = []
  sysctlTitle = helptext_advanced.fieldset_sysctl
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
    private route: ActivatedRoute
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
  }
  
  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }
  
  formatSyslogLevel(level: string): string {
    return helptext_advanced.sysloglevel.options.find(option => option.value === level).label;
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
          if (item.label === helptext_advanced.system_dataset_placeholder) {
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
            title: helptext_advanced.fieldset_console,
            id: 'console',
            items: [
              {
                label: helptext_advanced.consolemenu_placeholder,
                value: res.consolemenu ? helptext.enabled : helptext.disabled,
              },
              {
                label: helptext_advanced.serialconsole_placeholder,
                value: res.serialconsole ? helptext.enabled : helptext.disabled,
              },
              {
                label: helptext_advanced.serialport_placeholder,
                value: res.serialport ? res.serialport : '–',
              },
              {
                label: helptext_advanced.serialspeed_placeholder,
                value: res.serialspeed ? `${res.serialspeed} bps` : '–',
              },
              {
                label: helptext_advanced.motd_placeholder,
                value: res.motd ? res.motd.toString() : '–',
              },
            ],
          },
          {
            title: helptext_advanced.fieldset_syslog,
            id: 'syslog',
            items: [
              {
                label: helptext_advanced.fqdn_placeholder,
                value: res.fqdn_syslog ? helptext.enabled : helptext.disabled,
              },
              {
                label: helptext_advanced.sysloglevel.placeholder,
                value: this.formatSyslogLevel(res.sysloglevel),
              },
              {
                label: helptext_advanced.syslogserver.placeholder,
                value: res.syslogserver ? res.syslogserver : '–',
              },
              {
                label: helptext_advanced.syslog_transport.placeholder,
                value: res.syslog_transport,
              },
              {
                label: helptext_advanced.system_dataset_placeholder,
                value: this.syslog ? helptext.enabled : helptext.disabled,
              },
            ],
          },
          {
            title: helptext_advanced.fieldset_kernel,
            id: 'kernel',
            items: [
              {
                label: helptext_advanced.autotune_placeholder,
                value: res.autotune ? helptext.enabled : helptext.disabled,
              },
              {
                label: helptext_advanced.debugkernel_placeholder,
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
        if (!id) {
          addComponent.showFirstTimeWarning = this.isFirstTime
        }
        break
      case 'kernel':
        addComponent = this.kernelFormComponent
        break
      case 'syslog':
        addComponent = this.syslogFormComponent
        break
      default:
    }
    this.sysGeneralService.sendConfigData(this.configData)
    this.modalService.open('slide-in-form', addComponent, id)
    this.isFirstTime = false
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

  ngOnDestroy() {
    this.refreshCardData.unsubscribe()
    this.refreshTable.unsubscribe()
    this.getAdvancedConfig.unsubscribe()
    this.getSysctlSubscription.unsubscribe()
  }
}
