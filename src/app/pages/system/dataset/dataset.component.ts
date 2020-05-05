import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import * as _ from 'lodash';
import { WebSocketService, DialogService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_dataset } from 'app/helptext/system/dataset';
import { EntityUtils } from '../../common/entity/utils';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-system-dataset',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class DatasetComponent {

  protected queryCall: string = 'systemdataset.config';
  protected updateCall: string = 'systemdataset.update';
  public isEntity = false;

  public formGroup: FormGroup;
  public entityForm: any;

  protected syslog_subscription: any;
  protected syslog_warned = false;
  protected syslog_fg: any;
  protected syslog_value: any;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_dataset.metadata.fieldsets[0],
      class:'edit-system-dataset',
      label:true,
      width:'300px',
      config:[
        {
          type: 'select',
          name: 'pool',
          placeholder: helptext_system_dataset.pool.placeholder,
          tooltip: helptext_system_dataset.pool.tooltip,
          options: [
            {label: '---', value: null},
          ]
        },
        {
          type: 'checkbox',
          name: 'syslog',
          placeholder: helptext_system_dataset.syslog.placeholder,
          tooltip : helptext_system_dataset.syslog.tooltip
        }
      ]
    },
    {
      name:'divider',
      divider:true
    },
  ]

  private pool: any;
  private syslog: any;
  constructor(private ws: WebSocketService,
    private loader: AppLoaderService, 
    private dialogService: DialogService) {}

  preInit(EntityForm) {
    
    this.ws.call('boot.pool_name').subscribe( res => {
      this.pool = _.find(this.fieldConfig, {'name': 'pool'});
      this.pool.options.push({ label: res, value: res});
    });
    
    this.ws.call('pool.query').subscribe( res => {
       if (res) {
         this.pool = _.find(this.fieldConfig, {'name': 'pool'});
         res.forEach( x => {
           this.pool.options.push({ label: x.name, value: x.name});
         });
       }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    /*this.ws.call('systemdataset.config').subscribe(res => {
      entityForm.formGroup.controls['pool'].setValue(res.pool);
      entityForm.formGroup.controls['syslog'].setValue(res.syslog);
    });*/
    this.syslog_fg = this.entityForm.formGroup.controls['syslog'];
    this.ws.call('failover.licensed').subscribe((is_ha) => {
      if (is_ha) {
        this.syslog_subscription = this.syslog_fg.valueChanges.subscribe(res => {
          if (!this.syslog_warned && res !== this.syslog_value) {
            this.dialogService.confirm(helptext_system_dataset.syslog_warning.title, helptext_system_dataset.syslog_warning.message).subscribe(confirm => {
              if (confirm) {
                this.syslog_warned = true;
              } else {
                this.syslog_fg.setValue(this.syslog_value);
              }
            });
          }
        });
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    this.syslog_value = data['syslog'];
    return data;
  };

  customSubmit(value) {
    this.loader.open();
    this.ws.call("service.query").subscribe(
      (services) => {
        const smbShare = _.find(services, {'service': "cifs"});
        if (smbShare.state === 'RUNNING') {
          this.loader.close();
          this.dialogService.confirm(
            T('Restart SMB Service'),
            T('The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.'),
            false,
            T('Continue')
          ).subscribe((confirmed) => {
            if (confirmed) {
              this.loader.open();
              this.doUpdate(value);
            }
          });
        } else {
          this.doUpdate(value);
        }
      }
    );
  }

  doUpdate(value) {
    this.ws.job('systemdataset.update', [value]).subscribe(
      (res) => {
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
        }
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
      }
    );
  }
}
