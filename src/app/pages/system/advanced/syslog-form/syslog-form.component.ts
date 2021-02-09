import { Component, OnDestroy } from '@angular/core'
import { FormControl } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { helptext_system_general as helptext } from 'app/helptext/system/general'
import { helptext_system_advanced } from 'app/helptext/system/advanced'
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface'
import * as _ from 'lodash'
import { Subscription } from 'rxjs'
import {
  DialogService,
  LanguageService,
  StorageService,
  SystemGeneralService,
  WebSocketService,
} from '../../../../services'
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service'
import { ModalService } from '../../../../services/modal.service'
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface'
import { EntityUtils } from '../../../common/entity/utils'

@Component({
  selector: 'app-syslog-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [],
})
export class SyslogFormComponent implements OnDestroy {
  protected queryCall = 'system.advanced.config'
  protected updateCall = 'system.advanced.update'
  protected isOneColumnForm = true
  private getDataFromDash: Subscription
  private getDatasetConfig: Subscription
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.fieldset_kernel,
      label: false,
      class: 'console',
      config: [
        {
          type: 'checkbox',
          name: 'fqdn_syslog',
          placeholder: helptext_system_advanced.fqdn_placeholder,
          tooltip: helptext_system_advanced.fqdn_tooltip,
        },
        {
          type: 'select',
          name: 'sysloglevel',
          placeholder: helptext_system_advanced.sysloglevel.placeholder,
          tooltip: helptext_system_advanced.sysloglevel.tooltip,
          options: helptext_system_advanced.sysloglevel.options,
        },
        {
          type: 'input',
          name: 'syslogserver',
          placeholder: helptext_system_advanced.syslogserver.placeholder,
          tooltip: helptext_system_advanced.syslogserver.tooltip,
        },
        {
          type: 'select',
          name: 'syslog_transport',
          placeholder: helptext_system_advanced.syslog_transport.placeholder,
          tooltip: helptext_system_advanced.syslog_transport.tooltip,
          options: helptext_system_advanced.syslog_transport.options,
        },
        {
          type: 'select',
          name: 'syslog_tls_certificate',
          placeholder:
            helptext_system_advanced.syslog_tls_certificate.placeholder,
          tooltip: helptext_system_advanced.syslog_tls_certificate.tooltip,
          options: [],
          relation: [
            {
              action: 'SHOW',
              when: [
                {
                  name: 'syslog_transport',
                  value: 'TLS',
                },
              ],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'syslog',
          placeholder: helptext_system_advanced.system_dataset_placeholder,
          tooltip: helptext_system_advanced.system_dataset_tooltip,
        },
      ],
    },
    { 
      name:'divider',
      divider: true 
    }
  ]

  private entityForm: any
  private configData: any
  protected title = helptext_system_advanced.fieldset_syslog

  constructor(
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService
  ) {
    this.getDataFromDash = this.sysGeneralService.sendConfigData$.subscribe(
      (res) => {
        this.configData = res
      }
    )
  }

  reconnect(href) {
    if (this.entityForm.ws.connected) {
      this.loader.close()
      // ws is connected
      window.location.replace(href)
    } else {
      setTimeout(() => {
        this.reconnect(href)
      }, 5000)
    }
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit
    this.getDatasetConfig = this.ws.call('systemdataset.config').subscribe((res) => {
      entityEdit.formGroup.controls.syslog.setValue(res.syslog)
    })
  }

  public customSubmit(body) {
    this.loader.open()
    const syslog_value = body.syslog
    delete body.syslog

    return this.ws.call('system.advanced.update', [body]).subscribe(() => {
      this.ws.job('systemdataset.update', [{ syslog: syslog_value }]).subscribe((res) => {
        if (res.error) {
          this.loader.close();
          if (res.exc_info && res.exc_info.extra) {
            res.extra = res.exc_info.extra;
          }
          new EntityUtils().handleWSError(this, res);
        }
        if (res.state === 'SUCCESS') {
          this.loader.close();
          this.entityForm.success = true;
          this.entityForm.formGroup.markAsPristine();
          this.modalService.close('slide-in-form')
          this.sysGeneralService.refreshSysGeneral()
        }
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
      });
    },
    (res) => {
      this.loader.close()
      new EntityUtils().handleWSError(this.entityForm, res)
    })
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value)
  }

  ngOnDestroy() {
    this.getDatasetConfig.unsubscribe()
    this.getDataFromDash.unsubscribe()
  }
}
