import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-alertservice-edit-hipchat',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceEditHipchatComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type'
    },{
      type: 'input',
      name: 'cluster_name',
      placeholder: 'Cluster Name'
    },{
      type: 'input',
      name: 'base_url',
      placeholder: 'Url',
      value: 'https://api.hipchat.com/v2/'
    },{
      type: 'input',
      name: 'room_id',
      placeholder: 'Room'
    },{
      type: 'input',
      name: 'auth_token',
      placeholder: 'Auth Token'
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled'
    },
  ];

  resourceTransformIncomingRestData(data:any): any {
    
    data.cluster_name = data.attributes.cluster_name;
    data.base_url = data.attributes.base_url;
    data.room_id = data.attributes.room_id;
    data.auth_token = data.attributes.auth_token;

    return data;
  };


  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {

  }

  afterInit(entityForm: any) {
  }
}
