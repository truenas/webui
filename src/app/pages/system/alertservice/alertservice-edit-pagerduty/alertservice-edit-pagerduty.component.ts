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
  selector : 'app-alertservice-edit-pagerduty',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceEditPagerdutyComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      isHidden: true
    },{
      type : 'input',
      name : 'client_name',
      placeholder: 'client_name',
      tooltip: 'Enter the monitoring client name.',
    },{
      type : 'input',
      name : 'service_key',
      placeholder: 'service_key',
      tooltip: 'Paste the service_key for the service.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the PagerDuty service.',
    },
  ];


  resourceTransformIncomingRestData(data:any): any {
    data.client_name = data.attributes.client_name;
    data.service_key = data.attributes.service_key;
    
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
