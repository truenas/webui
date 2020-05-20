import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import * as _ from 'lodash';
import { RestService, WebSocketService, DialogService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_dataset } from 'app/helptext/system/dataset';
import { EntityUtils } from '../../common/entity/utils';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-system-dataset',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class DatasetComponent implements OnInit{

  protected resource_name: string = 'storage/dataset';
  protected volume_name: string = 'storage/volume';
  public formGroup: FormGroup;
  public entityForm: any;

  protected syslog_subscription: any;
  protected syslog_warned = false;
  protected syslog_fg: any;
  protected syslog_value: boolean;

  protected pool_subscription: any;
  protected pool_warned = false;
  protected pool_fg: any;
  protected pool_value: any;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'pool',
      placeholder: helptext_system_dataset.pool.placeholder,
      tooltip: helptext_system_dataset.pool.tooltip,
      options: [
        {label: '---', value: null},
        { label: 'freenas-boot', value: 'freenas-boot' },
      ]
    },
    {
      type: 'checkbox',
      name: 'syslog',
      placeholder: helptext_system_dataset.syslog.placeholder,
      tooltip : helptext_system_dataset.syslog.tooltip
    }
  ];

  private pool: any;
  private syslog: any;
  constructor(private rest: RestService, private ws: WebSocketService,
              private loader: AppLoaderService, private dialogService: DialogService) {}

  ngOnInit() {
    this.rest.get(this.volume_name, {}).subscribe( res => {
       if (res) {
         this.pool = _.find(this.fieldConfig, {'name': 'pool'});
         res.data.forEach( x => {
           this.pool.options.push({ label: x.name, value: x.name});
         });
       }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.syslog_fg = entityForm.formGroup.controls['syslog'];
    this.pool_fg = entityForm.formGroup.controls['pool'];
    this.ws.call('systemdataset.config').subscribe(res => {
      this.pool_value = res.pool;
      this.pool_fg.setValue(this.pool_value);
      this.syslog_value = res.syslog;
      this.syslog_fg.setValue(this.syslog_value);
    });
    if (window.localStorage.getItem('is_freenas') === 'false') {
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
          this.pool_subscription = this.pool_fg.valueChanges.subscribe(res => {
            if (!this.pool_warned && res !== this.pool_value) {
              this.dialogService.confirm(helptext_system_dataset.pool_warning.title, helptext_system_dataset.pool_warning.message).subscribe(confirm => {
                if (confirm) {
                  this.pool_warned = true;
                } else {
                  this.pool_fg.setValue(this.pool_value);
                }
              });
            }
          });
        }
      });
    }
  }

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
