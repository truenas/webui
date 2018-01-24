import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Rx';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';
import { debounce } from 'rxjs/operator/debounce';
import { debug } from 'util';

@Component({
   selector : 'bootenv-attach-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class BootEnvAttachFormComponent {
  protected route_success: string[] = [ 'system', 'bootenv', 'status' ];
  protected isEntity: boolean = true;
  protected addCall = 'boot.attach';
  protected pk: any;
  protected isNew: boolean = true;


  protected entityForm: any;

  public fieldConfig: FieldConfig[] =[
    {
      type: 'select',
      name: 'dev',
      placeholder: 'Member Disk',
      tooltip : 'Select the device to attach.',
      options :[]
    },
    {
      type: 'checkbox',
      name: 'expand',
      placeholder: 'Use all disk space',
      tooltip : 'Gives control of how much of the new device is made\
 available to ZFS. When checked, the entire capacity of the new device is used.',
    },

  ]
  protected diskChoice: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

preInit(entityForm: any) {
  this.route.params.subscribe(params => {
    this.pk = params['pk'];
  });
  this.entityForm = entityForm;
}

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.diskChoice = _.find(this.fieldConfig, {'name':'dev'});
    this.ws.call('disk.get_unused').subscribe((res)=>{
      res.forEach((item) => {
        this.diskChoice.options.push({label : item.name, value : item.name});
      });
    });
    entityForm.submitFunction = this.submitFunction;
  }
  submitFunction(entityForm){
    const payload = {};
    payload['expand'] = entityForm.expand;
    return this.ws.call('boot.attach', [entityForm.dev, payload]);
  }

}
