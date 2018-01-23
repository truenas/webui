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
  selector : 'app-alertservice-edit-aws',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceEditAWSComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'service name',
      tooltip: 'Amazon Web Service (AWS)\
 Simple Notification Service (SNS).',
      isHidden: true,
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
      name : 'base_url',
      placeholder : 'base_url',
      tooltip: 'Example: http://s3.example.com',
    },
    {
      type : 'input',
      name : 'aws_access_key_id',
      placeholder : 'key id',
      tooltip: 'Paste the AWS Access Key ID for the\
 AWS account here.',
    },
    {
      type: 'input',
      name: 'aws_secret_access_key',
      placeholder: 'secret access key',
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

  resourceTransformIncomingRestData(data:any): any {
    data.aws_access_key_id = data.attributes.aws_access_key_id;
    data.aws_secret_access_key = data.attributes.aws_secret_access_key;
    data.base_url = data.attributes.base_url;
    data.region = data.attributes.region;
    data.topic_arn = data.attributes.topic_arn;
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
