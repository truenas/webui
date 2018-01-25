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
  selector : 'app-alertservice-add-opengenie',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceAddOpsgenieComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'OpsGenie',
      isHidden: true
    },{
      type : 'input',
      name : 'cluster_name',
      placeholder: 'cluster_name',
      tooltip: 'Enter the name of the cluster. To find the\
 <b>cluster_name</b> sign in to the OpsGenie web interface, and\
 go to <b>Integrations -> Configured Integrations</b>. Click the\
 desired integration, and go to the <b>Name</b> field of the\
 <b>Settings</b> form to locate the cluster name.',
    },{
      type : 'input',
      name : 'api_key',
      placeholder: 'api_key',
      tooltip: 'Paste the <b>api_key</b> here. To find the API key sign\
 in to the OpsGenie web interface, and go to\
 <b>Integrations -> Configured Integrations</b>. Click the desired\
 integration and go to the <b>API Key</b> field of the <b>Settings</b> form to locate the API key.\
 Refer to the <a href="https://docs.opsgenie.com/v1.0/docs/api-integration" target="_blank"> OpsGenie documentation </a>\
 for more information about API integration.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the OpsGenie alert service.',
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
