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
  selector : 'app-alertservice-add-pagerduty',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceAddPagerdutyComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'PagerDuty',
      isHidden: true
    },{
      type : 'input',
      name : 'client_name',
      placeholder: 'client_name',
      tooltip: 'Enter the monitoring <b>client name</b>.\
 To locate the client name, sign in to the PagerDuty web interface, and\
 go to <b>Configuration -> Services -> Integrations</b>.\
 Find the name of the desired integration, which is the same as the client name.',
    },{
      type : 'input',
      name : 'service_key',
      placeholder: 'service_key',
      tooltip: 'Paste the <b>service key</b> or <b>integration key</b> for the service.\
 To find the service key, sign in to the PagerDuty\
 web interface, and go to <b>Configuration -> Services -> Integrations</b>.\
 Click the desired integration. Here is an example\
 service key: <b>3jf2f2f3df7647fdj222bc3vbe1897dj</b>.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the PagerDuty service.',
    },
  ];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {}

  afterInit(entityAdd: any) {}
}
