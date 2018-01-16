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
  selector : 'app-alertservice-add-aws',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceAddAWSComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'AWSSNS',
      tooltip: 'Amazon Web Service (AWS)\
 Simple Notification Service (SNS).',
      disabled: true
    },
    {
      type : 'input',
      name : 'region',
      placeholder : 'region',
      tooltip: 'Paste the region for the AWS account here.',
    },
    {
      type: 'input',
      name: 'topic_arn',
      placeholder: 'topic_arn',
      tooltip: 'Paste the Topic Amazon Resource Name (ARN) to publish to.\
 Here is an example ARN:\
 <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.',
    },
    {
      type : 'input',
      name : 'aws_access_key_id',
      placeholder : 'aws_access_key_id',
      tooltip: 'Paste the AWS Access Key ID for the\
 AWS account here.',
    },
    {
      type: 'input',
      name: 'aws_secret_access_key',
      placeholder: 'aws_secret_access_key',
      tooltip: 'Paste the AWS Secret Access Key for the AWS\
 account here.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the Amazon Web Service\
 Simple Notification Service.',
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
