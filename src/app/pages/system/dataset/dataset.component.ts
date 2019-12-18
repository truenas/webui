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
    this.ws.call('systemdataset.config').subscribe(res => {
      entityForm.formGroup.controls['pool'].setValue(res.pool);
      entityForm.formGroup.controls['syslog'].setValue(res.syslog);
    });
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
