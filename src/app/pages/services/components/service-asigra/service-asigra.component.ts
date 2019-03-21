import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-service-asigra',
  template : ` <entity-form [conf]="this"></entity-form>`
})
export class ServiceAsigraComponent {
  protected addCall = "asigra.config";
  protected route_success: string[] = [ 'services' ];
  public entityForm: any;
  public fs: any;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'asigra_base_filesystem',
      placeholder : 'Base Filesystem',
      tooltip: 'Base Filesystem tooltip?',
      options: [],
    }
  ]

  public custActions: Array<any> = [
    {
      id : 'launch_ds_operator',
      name : 'Launch DS Operator',
      function : () => {
        let url = new Array('/').concat(['_plugins', 'asigra', 'DSOP.jnlp']);
        window.open(url.toString(), '_blank')
      }
    }
  ];

  constructor(protected router: Router, protected ws: WebSocketService) {}

  afterInit (entityForm: any) {
    entityForm.ws.call('pool.filesystem_choices', []).subscribe((fs_list) => {
      this.fs = _.find(this.fieldConfig, {name : "asigra_base_filesystem"});
      fs_list.forEach((item) => {
        console.log(item)
        this.fs.options.push({label : item, value : item});
          entityForm.formGroup.controls['asigra_base_filesystem'].setValue(
          fs_list[0]);
        });
      })
  }
}
