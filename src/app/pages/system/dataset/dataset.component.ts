import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_dataset } from 'app/helptext/system/dataset';
import { EntityUtils } from '../../common/entity/utils';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-system-dataset',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetComponent implements OnInit{

  protected resource_name: string = 'storage/dataset';
  protected volume_name: string = 'storage/volume';
  public formGroup: FormGroup;

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'pool',
    placeholder: helptext_system_dataset.pool.placeholder,
    tooltip: helptext_system_dataset.pool.tooltip,
    options: [
      {label: '---', value: null},
      { label: 'freenas-boot', value: 'freenas-boot' },
    ]
  },{
      type: 'checkbox',
      name: 'syslog',
      placeholder: helptext_system_dataset.syslog.placeholder,
      tooltip : helptext_system_dataset.syslog.tooltip
    },{
      type: 'checkbox',
      name: 'rrd',
      placeholder: helptext_system_dataset.rrd.placeholder,
      tooltip : helptext_system_dataset.rrd.tooltip
    }];

  private pool: any;
  private syslog: any;
  private rrd: any;
  constructor(private rest: RestService, private ws: WebSocketService,
              private loader: AppLoaderService, private snackBar: MatSnackBar) {}

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
    this.ws.call('systemdataset.config').subscribe(res => {
      entityForm.formGroup.controls['pool'].setValue(res.pool);
      entityForm.formGroup.controls['syslog'].setValue(res.syslog);
      entityForm.formGroup.controls['rrd'].setValue(res.rrd);
    });
  }

  customSubmit(value) {
    this.loader.open();
    this.ws.job('systemdataset.update', [value]).subscribe(
      (res) => {
        this.loader.close();
        if (res.error) {
          if (res.exc_info && res.exc_info.extra) {
            res.extra = res.exc_info.extra;
          }
          new EntityUtils().handleWSError(this, res);
        }
        if (res.state === 'SUCCESS') {
          this.snackBar.open("Settings saved.", 'close', { duration: 5000 })
        }
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
      }
    );

  }
}
