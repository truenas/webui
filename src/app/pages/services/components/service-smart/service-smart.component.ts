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
import { T } from '../../../../translate-marker';

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
      placeholder : T('Check Interval'),
      tooltip: T('In minutes, how often <b>smartd</b> wakes up to check if\
            any tests have been configured to run.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'smart_powermode',
      placeholder : T('Power Mode'),
      tooltip: T('Tests are not performed if the system enters the\
       specified power mode; choices\
       are: <i>Never</i>, <i>Sleep</i>, <i>Standby</i>, or <i>Idle</i>.'),
      options : [
        {label : 'Never', value : 'never'},
        {label : 'Sleep', value : 'sleep'},
        {label : 'Standby', value : 'standby'},
        {label : 'Idle', value : 'idle'},
      ],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_difference',
      placeholder : T('Difference'),
      tooltip: T('Default of <i>0</i> disables this\
       check, otherwise reports if the temperature of a drive has\
       changed by N degrees Celsius since last report.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_informational',
      placeholder : T('Informational'),
      tooltip: T('default of 0 disables this check, otherwise will\
       message with a log level of LOG_INFO if the temperature is higher\
       than specified degrees in Celsius.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_critical',
      placeholder : T('Critical'),
      tooltip: T('Default of 0 disables this check, otherwise will\
       message with a log level of LOG_CRIT and send an email if the\
       temperature is higher than specified degrees in Celsius.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_email',
      placeholder : T('Email'),
      tooltip: T('Email address of person or alias to receive S.M.A.R.T. alerts.'),
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) {  }
}
