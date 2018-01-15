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
  selector : 'app-alertservice-add-slack',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceAddSlackComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'service name',
      value: 'Slack',
      disabled: true
    },{
      type : 'input',
      name : 'username',
      placeholder: 'username',
      tooltip: 'Enter the Slack username.',
    },{
      type : 'input',
      name : 'cluster_name',
      placeholder: 'cluster_name',
      tooltip: 'Enter the name of the cluster. Note this field is\
 optional and can be left blank.',
    },{
      type : 'input',
      name : 'url',
      placeholder: 'url',
      tooltip: 'Paste the incoming webhook URL associated with\
 this service. Refer to the\
 <a href="https://api.slack.com/incoming-webhooks" target="_blank"> Slack API documentation</a>\
 for more information about setting up incoming webhooks.',
    },{
      type : 'input',
      name : 'channel',
      placeholder: 'channel',
      tooltip: 'Select the Slack channel the Incoming\
 WebHook will post messages to.',
    },{
      type : 'input',
      name : 'icon_url',
      placeholder: 'icon_url',
      tooltip: 'URL of a custom image for notification icons.\
 This overrides the default if set in the Incoming Webhook settings.\
 Note this field is optional and can be left blank.',
    },{
      type : 'checkbox',
      name : 'detailed',
      placeholder : 'detailed',
      tooltip: 'Enable detailed Slack notifications.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the Slack alert service.',
    }
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
