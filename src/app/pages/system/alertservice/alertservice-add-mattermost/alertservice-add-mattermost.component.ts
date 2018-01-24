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
  selector : 'app-alertservice-add-mattermost',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceAddMattermostComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'Mattermost',
      isHidden: true
    },{
      type : 'input',
      name : 'username',
      placeholder: 'username',
      tooltip: 'Enter the Mattermost username.',
    },{
      type : 'input',
      name : 'password',
      placeholder: 'password',
      tooltip: 'Enter the Mattermost password.',
    },{
      type : 'input',
      name : 'cluster_name',
      placeholder: 'cluster_name',
      tooltip: 'Enter the name of the cluster to join.',
    },{
      type : 'input',
      name : 'url',
      placeholder: 'url',
      tooltip:'Paste the incoming webhook URL asssociated\
 with this service.\
 Refer to the <a href="https://docs.mattermost.com/developer/webhooks-incoming.html" target="_blank">Mattermost User Guide</a>\
 for more information about incoming webhooks.',
    },{
      type : 'input',
      name : 'channel',
      placeholder: 'channel',
      tooltip: 'Enter the name of the desired channel\
 that will recieve the notifications. This overides the default\
 channel in the Incoming Webhook settings.\
 Refer to the <a href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels" target="_blank">Mattermost User Guide</a>\
 for more information about managing channels.',
    },{
      type : 'input',
      name : 'team',
      placeholder: 'team',
      tooltip: 'Enter the Mattermost team name.\
 Refer to the <a href="https://docs.mattermost.com/help/getting-started/creating-teams.html" target="_blank">Mattermost User Guide</a>\
 for more information about creating teams.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the Mattermost service.'
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
