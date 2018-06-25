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
      tooltip: T('Define a number of minutes for <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=smartd&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">smartd</a> to wake up and check if any\
                  tests are configured to run.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'smart_powermode',
      placeholder : T('Power Mode'),
      tooltip: T('Tests are not performed when the system enters the\
                  selected power mode.'),
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
      tooltip: T('Enter a number of degrees in Celsius. SMART reports if\
                  the temperature of a drive has changed by N degrees\
                  Celsius since the last report.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_informational',
      placeholder : T('Informational'),
      tooltip: T('Enter a threshold temperature in Celsius. SMART will\
                  message with a log level of LOG_INFO if the\
                  temperature is higher than the threshold.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_critical',
      placeholder : T('Critical'),
      tooltip: T('Enter a threshold temperature in Celsius. SMART will\
                  message with a log level of LOG_CRIT and send an email\
                  if the temperature is higher than the threshold.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'smart_email',
      placeholder : T('Email'),
      tooltip: T('Enter an email address to receive <a\
                  href="..//docs/services.html#s-m-a-r-t"\
                  target="_blank">S.M.A.R.T.</a> alerts; use a space to \
                  separate multiple email addresses.'),
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) {  }
}
