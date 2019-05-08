import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material';
import { WebSocketService, AppLoaderService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-service-asigra',
  template : ` <entity-form [conf]="this"></entity-form>`
})
export class ServiceAsigraComponent {
  protected addCall = "asigra.update";
  protected route_success: string[] = [ 'services' ];
  public entityForm: any;
  public fs: any;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'filesystem',
      placeholder : T('Base Filesystem'),
      tooltip: T('Base Filesystem tooltip?'),
      options: [],
    }
  ]

  public custActions: Array<any> = [
    {
      id : 'launch_ds_operator',
      name : T('Launch DS Operator'),
      function : () => {
        window.open('_plugins/asigra/DSOP.jnlp', '_blank')
      }
    }
  ];

  constructor(protected router: Router, protected ws: WebSocketService, protected loader: AppLoaderService,
    protected snackBar: MatSnackBar) {}

  afterInit (entityForm: any) {
    entityForm.ws.call('pool.filesystem_choices', []).subscribe((fs_list) => {
      this.fs = _.find(this.fieldConfig, {name : "filesystem"});
      fs_list.forEach((item) => {
        this.fs.options.push({label : item, value : item});
        });
    });
    entityForm.ws.call('asigra.config').subscribe((res) => {
      entityForm.formGroup.controls['filesystem'].setValue(res.filesystem);
    })

  }

  customSubmit(value) {
    this.loader.open();
    this.ws.call(this.addCall, [value]).subscribe((res) => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(this.route_success));
      this.snackBar.open(T('Asigra successfully updated.'), T('close'), { duration: 5000 })
    },
    (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, err);
    })
  }
}
