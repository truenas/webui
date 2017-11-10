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

@Component({
   selector : 'bootenv-attach-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class BootEnvAttachFormComponent {

  //protected resource_name: string = 'storage/vmwareplugin';
  protected route_success: string[] = [ 'bootenv', 'status' ];
  protected isEntity: boolean = true;
  protected pk: any;
  public formGroup: FormGroup;

  protected entityForm: any;
  private datastore: any;

  protected fieldConfig: FieldConfig[] =[
    {
      type: 'select', 
      name: 'dev', 
      placeholder: 'Member Disk',
    },
    {
      type: 'checkbox', 
      name: 'expand', 
      placeholder: 'Use all disk space',
    },

  ]
  private diskChoice:  any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.ws.call('disk.get_unused').subscribe((res)=>{
      this.diskChoice = _.find(this.fieldConfig, {'name':'dev'});
      for(let diskIdx = 0; diskIdx < res.length; diskIdx++){
        debugger;
      }

    })
  }

}
