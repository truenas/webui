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
  selector : 'ups-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceUPSComponent {
  protected resource_name: string = 'services/ups';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ups_mode',
      placeholder : 'UPS Mode',
      tooltip : 'Choose <i>Master</i> if the UPS is plugged directly\
 into the system serial port. This keeps the UPS as the last item to\
 shut down. Choose <i>Slave</i> to have this system shut down before\
 the <i>Master</i>. See the\
 <a href="http://networkupstools.org/docs/user-manual.chunked/ar01s02.html#_monitoring_client" target="_blank">Network UPS Tools Overview</a>\
 for more information.',
      options : [
        {label : 'Master', value : 'master'},
        {label : 'Slave', value : 'slave'},
      ]
    },
    {
      type : 'input',
      name : 'ups_identifier',
      placeholder : 'Identifier',
      tooltip : 'Enter a string. It can contain alphanumeric, period,\
 comma, hyphen, and underscore characters.',
    },
    {
      type : 'select',
      name : 'ups_driver',
      placeholder : 'Driver',
      tooltip : 'Check the\
 <a href="http://networkupstools.org/stable-hcl.html" target="_blank">Network UPS Tools compatibility list</a>\
 for a list of supported UPS devices.',
    },
    {
      type : 'select',
      name : 'ups_port',
      placeholder : 'Port',
      tooltip : 'Select the serial or USB port the UPS is plugged into.',
    },
    {
      type : 'textarea',
      name : 'ups_options',
      placeholder : 'Auxiliary Parameters(ups.conf)',
      tooltip : 'Additional options are defined in\
 <a href="http://networkupstools.org/docs/man/ups.conf.html" target="_blank">UPS.CONF(5)</a>.',
    },
    {
      type : 'textarea',
      name : 'ups_optionsupsd',
      placeholder : 'Auxiliary Parameters(upsd.conf)',
      tooltip : 'Additional options are defined in\
 <a href="http://networkupstools.org/docs/man/upsd.conf.html" target="_blank">UPSD.CONF(5)</a>.',
    },
    {
      type : 'input',
      name : 'ups_description',
      placeholder : 'Description',
      tooltip : 'Add an optional description for this service.',
    },
    {
      type : 'select',
      name : 'ups_shutdown',
      placeholder : 'Shutdown Mode',
      tooltip : 'Choose when the UPS initiates shutdown.',
      options : [
        {label : 'UPS reaches low battery', value : 'lowbatt'},
        {label : 'UPS goes on battery', value : 'batt'},
      ]
    },
    {
      type : 'input',
      name : 'ups_shutdowntimer',
      placeholder : 'Shutdown Timer',
      tooltip : 'Enter a value in seconds for the the UPS to wait\
 before initiating shutdown. Shutdown will not occur if power is\
 restored while the timer is counting down. This value only applies if\
 <b>Shutdown mode</b> is set to <i>UPS goes on battery</i>.',
    },
    {
      type : 'input',
      name : 'ups_shutdowncmd',
      placeholder : 'Shutdown Command',
      tooltip : 'Type the command to shut down the computer when either\
 battery power is low or the shutdown timer ends.',
    },
    {
      type : 'input',
      name : 'ups_monuser',
      placeholder : 'Monitor User',
      tooltip : 'Keeping the default is recommended.',
    },
    {
      type : 'input',
      name : 'ups_monpwd',
      placeholder : 'Monitor Password',
      tooltip : 'Change this default password. The new password cannot\
 contain a <i>space</i> or <b>#</b> .',
    },
    {
      type : 'textarea',
      name : 'ups_extrausers',
      placeholder : 'Extra Users(upsd.conf)',
      tooltip : 'Define the accounts that have administrative access.\
 See\
 <a href="http://networkupstools.org/docs/man/upsd.users.html" target="_blank">upsd.users(5)</a>\
 for examples.',
    },
    {
      type : 'checkbox',
      name : 'ups_rmonitor',
      placeholder : 'Remote Monitor',
      tooltip : 'When enabled, the default configuration listens on all\
 interfaces using the known values of user <i>upsmon</i> and password\
 <i>fixmepass</i>.',
    },
    {
      type : 'checkbox',
      name : 'ups_emailnotify',
      placeholder : 'Send Email Status Updates',
      tooltip : 'Check to enable the service sending messages to the\
 address defined in the <b>To Email</b> field.',
    },
    {
      type : 'input',
      name : 'ups_toemail',
      placeholder : 'To Email',
      tooltip : 'Type the email addresses to receive status updates.\
 Separate multiple addresses with a <b>;</b> .',
    },
    {
      type : 'input',
      name : 'ups_subject',
      placeholder : 'Email Subject',
      tooltip : 'Enter the subject for notification emails.',
    },
    {
      type : 'checkbox',
      name : 'ups_powerdown',
      placeholder : 'Power Off UPS',
      tooltip : 'Check this to have the UPS power off after shutting\
 down the FreeNAS system.',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { }
}
