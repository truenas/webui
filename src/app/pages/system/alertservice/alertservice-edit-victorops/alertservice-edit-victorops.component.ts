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
  selector : 'app-alertservice-edit-victorops',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceEditVictoropsComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'VictorOps',
      disabled: true
    },{
      type : 'input',
      name : 'routing_key',
      placeholder: 'routing_key',
      tooltip: 'Paste the routing key here. Refer to the <a href="https://help.victorops.com/knowledge-base/routing-keys/" target="_blank"> VictorOps Knowledge-base</a>\
 for more information about routing keys.',
    },{
      type : 'input',
      name : 'api_key',
      placeholder: 'api_key',
      tooltip: 'Paste the API key from the\
       VictorOps web portal.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the VictorOps\
      alert service.',
    },
  ];

  
  resourceTransformIncomingRestData(data:any): any {
    data.routing_key = data.attributes.routing_key;
    data.api_key = data.attributes.api_key;
    
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
