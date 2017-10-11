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
  protected isEntity = true;
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder : 'Service Name',
      value: 'AWS-SNS',
      isHidden: true
    },
    {
      type : 'input',
      name : 'region',
      placeholder : 'Region',
    },
    {
      type : 'input',
      name : 'topic-arn',
      placeholder : 'ARN',
    },
    {
      type : 'input',
      name : 'aws-access-key-id',
      placeholder : 'Key Id',
    },
    {
      type : 'input',
      name : 'aws-secret-access-key',
      placeholder : 'Secret Key',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      value: true
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

  afterInit(entityForm: any) {
  }
}
