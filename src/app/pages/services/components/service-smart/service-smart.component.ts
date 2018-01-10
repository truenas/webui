import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';


import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'smart-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceSMARTComponent {

  protected resource_name: string = 'services/smart';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'smart_interval',
      placeholder : 'Check Interval',
      tooltip: 'In minutes, how often <b>smartd</b> wakes up to check if\
      any tests have been configured to run.',
    },
    {
      type : 'select',
      name : 'smart_powermode',
      placeholder : 'Power Mode',
      options : [
        {label : 'Never', value : 'never'},
        {label : 'Sleep', value : 'sleep'},
        {label : 'Standby', value : 'standby'},
        {label : 'Idle', value : 'idle'},
      ]
    },
    {
      type : 'input',
      name : 'smart_difference',
      placeholder : 'Difference',
    },
    {
      type : 'input',
      name : 'smart_informational',
      placeholder : 'Informational',
      tooltip: 'Default of 0 disables this check, otherwise will\
 message with a log level of LOG_INFO if the temperature is higher\
 than specified degrees in Celsius.',
    },
    {
      type : 'input',
      name : 'smart_critical',
      placeholder : 'Critical',
      tooltip: 'Default of 0 disables this check, otherwise will\
 message with a log level of LOG_CRIT and send an email if the\
 temperature is higher than specified degrees in Celsius.',
    },
    {
      type : 'input',
      name : 'smart_email',
      placeholder : 'Email',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) {  }
}
