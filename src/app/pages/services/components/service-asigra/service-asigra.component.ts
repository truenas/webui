import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material';
import { WebSocketService, AppLoaderService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/services/components/service-asigra'

@Component({
  selector: 'app-service-asigra',
  template : ` <entity-form [conf]="this"></entity-form>`
})
export class ServiceAsigraComponent {
  protected addCall = "asigra.update";
  protected route_success: string[] = [ 'services' ];
  public entityForm: any;
  public fs: any;
  public isRunning: boolean = false;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'filesystem',
      placeholder : helptext.filesystem_placeholder,
      tooltip: helptext.filesystem_tooltip,
      options: [],
      required: true
    }
  ]

  public custActions: Array<any> = [];

  constructor(protected router: Router, protected ws: WebSocketService, protected loader: AppLoaderService,
    protected snackBar: MatSnackBar) {}

  afterInit (entityForm: any) {
    this.entityForm = entityForm;
    entityForm.ws.call('pool.filesystem_choices', []).subscribe((fs_list) => {
      this.fs = _.find(this.fieldConfig, {name : "filesystem"});
      fs_list.forEach((item) => {
        this.fs.options.push({label : item, value : item});
        });
    });
    entityForm.ws.call('asigra.config').subscribe((res) => {
      entityForm.formGroup.controls['filesystem'].setValue(res.filesystem);
    })
    entityForm.ws.call('service.query').subscribe((res) => {
      const result = res.find( item => item.service === 'asigra' );
      result.state === 'RUNNING' ? this.isRunning = true : this.isRunning = false;
      // Button is disabled if service isn't running
      this.custActions.push(
        {
          id : 'launch_ds_operator',
          name : helptext.launchbutton_name,
          function : () => {
            window.open('_plugins/asigra/DSOP.jnlp', '_blank')
          },
          disabled : !this.isRunning
        }
      )
    })
  }

  customSubmit(value) {
    this.loader.open();
    this.ws.call(this.addCall, [value]).subscribe((res) => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(this.route_success));
      this.snackBar.open(helptext.snackbar_message, T('close'), { duration: 5000 })
    },
    (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, err);
    })
  }
}
