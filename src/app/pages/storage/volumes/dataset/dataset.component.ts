import { Component } from '@angular/core'
import { FormGroup } from '@angular/forms'

import * as _ from 'lodash'
import { WebSocketService, DialogService } from '../../../../services'
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface'
import { helptext_system_dataset } from 'app/helptext/system/dataset'
import { EntityUtils } from '../../../common/entity/utils'
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service'
import { T } from '../../../../translate-marker'
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets'

@Component({
  selector: 'app-system-dataset',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [],
})
export class DatasetComponent {
  protected queryCall = 'systemdataset.config'
  protected updateCall = 'systemdataset.update'
  protected isOneColumnForm = true;
  
  public title = 'Configure Pool'
  public columnsOnForm = 1
  public isEntity = false
  public formGroup: FormGroup
  public entityForm: any

  protected pool_subscription: any
  protected pool_warned = false
  protected pool_fg: any
  protected pool_value: any

  public fieldConfig: FieldConfig[] = []
  public fieldSets = new FieldSets([
    {
      name: helptext_system_dataset.metadata.fieldsets[0],
      label: false,
      config: [
        {
          type: 'select',
          name: 'pool',
          placeholder: helptext_system_dataset.pool.placeholder,
          tooltip: helptext_system_dataset.pool.tooltip,
          options: [{ label: '---', value: null }],
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ])

  private pool: any

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService
  ) {}

  preInit() {    
    this.ws.call('boot.pool_name').subscribe((res) => {
      this.pool = this.fieldSets.config('pool')
      this.pool.options.push({ label: res, value: res })
    })

    this.ws.call('pool.query').subscribe((res) => {
      if (res) {
        this.pool = this.fieldSets.config('pool')
        res.forEach((x) => {
          this.pool.options.push({ label: x.name, value: x.name })
        })
      }
    })
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm
    this.pool_fg = this.entityForm.formGroup.controls['pool']
    this.ws.call('failover.licensed').subscribe((is_ha) => {
      if (is_ha) {
        this.pool_subscription = this.pool_fg.valueChanges.subscribe((res) => {
          if (!this.pool_warned && res !== this.pool_value) {
            this.dialogService
              .confirm(
                helptext_system_dataset.pool_warning.title,
                helptext_system_dataset.pool_warning.message
              )
              .subscribe((confirm) => {
                if (confirm) {
                  this.pool_warned = true
                } else {
                  this.pool_fg.setValue(this.pool_value)
                }
              })
          }
        })
      }
    })
  }

  resourceTransformIncomingRestData(data) {
    this.pool_value = data['pool']
    return data
  }

  customSubmit(value) {
    this.loader.open()
    this.ws.call('service.query').subscribe((services) => {
      const smbShare = _.find(services, { service: 'cifs' })
      if (smbShare.state === 'RUNNING') {
        this.loader.close()
        this.dialogService
          .confirm(
            T('Restart SMB Service'),
            T('The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.'),
            false,
            T('Continue')
          )
          .subscribe((confirmed) => {
            if (confirmed) {
              this.loader.open()
              this.doUpdate(value)
            }
          })
      } else {
        this.doUpdate(value)
      }
    })
  }

  doUpdate(value) {
    this.ws.job('systemdataset.update', [value]).subscribe(
      (res) => {
        if (res.error) {
          this.loader.close()
          if (res.exc_info && res.exc_info.extra) {
            res.extra = res.exc_info.extra
          }
          new EntityUtils().handleWSError(this, res)
        }
        if (res.state === 'SUCCESS') {
          this.loader.close()
          this.entityForm.success = true
          this.entityForm.formGroup.markAsPristine()
          this.entityForm.modalService.close('slide-in-form')
        }
      },
      (err) => {
        this.loader.close()
        new EntityUtils().handleWSError(this, err)
      }
    )
  }
}
