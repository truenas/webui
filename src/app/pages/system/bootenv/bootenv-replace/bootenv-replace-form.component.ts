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
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
   selector : 'bootenv-replace-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class BootEnvReplaceFormComponent {
  protected route_success: string[] = [ 'system', 'bootenv', 'status' ];
  protected isEntity: boolean = true;
  protected addCall = 'boot.replace';
  protected pk: any;
  protected isNew: boolean = true;


  protected entityForm: any;

  public fieldConfig: FieldConfig[] =[
    {
      type: 'select', 
      name: 'dev', 
      placeholder: 'Member Disk',
      options :[]
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
    const payload = this.pk.substring(5, this.pk.length);
    return this.ws.call('boot.replace', [payload, entityForm.dev]);
  }

}
