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
  selector : 'app-alertservice-edit-slack',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceEditSlackComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'service name'
    },{
      type : 'input',
      name : 'username',
      placeholder: 'username'
    },{
      type : 'input',
      name : 'cluster_name',
      placeholder: 'cluster_name'
    },{
      type : 'input',
      name : 'url',
      placeholder: 'url'
    },{
      type : 'input',
      name : 'channel',
      placeholder: 'channel'
    },{
      type : 'input',
      name : 'icon_url',
      placeholder: 'icon_url'
    },{
      type : 'checkbox',
      name : 'detailed',
      placeholder : 'detailed'
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled'
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    
    data.username = data.attributes.username;
    data.cluster_name = data.attributes.cluster_name;
    data.url = data.attributes.url;
    data.channel = data.attributes.channel;
    data.icon_url = data.attributes.icon_url;
    data.detailed = data.attributes.detailed;

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
