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
  selector : 'ups-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceUPSComponent {
  protected ups_driver: any;
  protected ups_port: any;
  protected resource_name: string = 'services/ups';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ups_mode',
      placeholder : T('UPS Mode'),
      tooltip : T('Choose <i>Master</i> if the UPS is plugged directly\
       into the system serial port. This keeps the UPS as the last item to\
       shut down. Choose <i>Slave</i> to have this system shut down before\
       the <i>Master</i>. See the\
       <a href="http://networkupstools.org/docs/user-manual.chunked/ar01s02.html#_monitoring_client" target="_blank">Network UPS Tools Overview</a>\
       for more information.'),
      options : [
        {label : 'Master', value : 'master'},
        {label : 'Slave', value : 'slave'},
      ]
    },
    {
      type : 'input',
      name : 'ups_identifier',
      placeholder : T('Identifier'),
      tooltip : T('Enter a string. It can contain alphanumeric, period,\
       comma, hyphen, and underscore characters.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'ups_driver',
      placeholder : T('Driver'),
      tooltip : T('Check the\
       <a href="http://networkupstools.org/stable-hcl.html" target="_blank">Network UPS Tools compatibility list</a>\
       for a list of supported UPS devices.'),
      required: true,
      options: [],
      validation : [ Validators.required ]
    },
    {
      type : 'input', //fixme - this should be a select but we need api for options
      name : 'ups_port',
      placeholder : T('Port'),
      //options: [],
      tooltip : T('Select the serial or USB port the UPS is plugged into.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'textarea',
      name : 'ups_options',
      placeholder : T('Auxiliary Parameters(ups.conf)'),
      tooltip : T('Additional options are defined in\
       <a href="http://networkupstools.org/docs/man/ups.conf.html" target="_blank">UPS.CONF(5)</a>.'),
    },
    {
      type : 'textarea',
      name : 'ups_optionsupsd',
      placeholder : T('Auxiliary Parameters(upsd.conf)'),
      tooltip : T('Additional options are defined in\
       <a href="http://networkupstools.org/docs/man/upsd.conf.html" target="_blank">UPSD.CONF(5)</a>.'),
    },
    {
      type : 'input',
      name : 'ups_description',
      placeholder : T('Description'),
      tooltip : T('Add an optional description for this service.'),
    },
    {
      type : 'select',
      name : 'ups_shutdown',
      placeholder : T('Shutdown Mode'),
      tooltip : T('Choose when the UPS initiates shutdown.'),
      options : [
        {label : 'UPS reaches low battery', value : 'lowbatt'},
        {label : 'UPS goes on battery', value : 'batt'},
      ]
    },
    {
      type : 'input',
      inputType: 'number',
      name : 'ups_shutdowntimer',
      placeholder : T('Shutdown Timer'),
      tooltip : T('Enter a value in seconds for the the UPS to wait\
       before initiating shutdown. Shutdown will not occur if power is\
       restored while the timer is counting down. This value only applies if\
       <b>Shutdown mode</b> is set to <i>UPS goes on battery</i>.'),
    },
    {
      type : 'input',
      name : 'ups_shutdowncmd',
      placeholder : T('Shutdown Command'),
      tooltip : T('Type the command to shut down the computer when either\
       battery power is low or the shutdown timer ends.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'ups_nocommwarntime',
      placeholder: T('No Communication Warning Time'),
      tooltip: T('Notify after this many seconds if it can’t reach any of \
        the UPS. It keeps warning you until the situation is fixed. Default \
        is 300 seconds.')
    },
    {
      type : 'input',
      name : 'ups_monuser',
      placeholder : T('Monitor User'),
      tooltip : T('Keeping the default is recommended.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ups_monpwd',
      inputType: 'password',
      placeholder : T('Monitor Password'),
      tooltip : T('Change this default password. The new password cannot\
       contain a <i>space</i> or <b>#</b> .'),
    },
    {
      type : 'textarea',
      name : 'ups_extrausers',
      placeholder : T('Extra Users(upsd.conf)'),
      tooltip : T('Define the accounts that have administrative access.\
       See\
       <a href="http://networkupstools.org/docs/man/upsd.users.html" target="_blank">upsd.users(5)</a>\
       for examples.'),
    },
    {
      type : 'checkbox',
      name : 'ups_rmonitor',
      placeholder : T('Remote Monitor'),
      tooltip : T('When enabled, the default configuration listens on all\
       interfaces using the known values of user <i>upsmon</i> and password\
       <i>fixmepass</i>.'),
    },
    {
      type : 'checkbox',
      name : 'ups_emailnotify',
      placeholder : T('Send Email Status Updates'),
      tooltip : T('Check to enable the service sending messages to the\
       address defined in the <b>To Email</b> field.'),
    },
    {
      type : 'input',
      name : 'ups_toemail',
      placeholder : T('To Email'),
      tooltip : T('Type the email addresses to receive status updates.\
       Separate multiple addresses with a <b>;</b> .'),
    },
    {
      type : 'input',
      name : 'ups_subject',
      placeholder : T('Email Subject'),
      tooltip : T('Enter the subject for notification emails.'),
    },
    {
      type : 'checkbox',
      name : 'ups_powerdown',
      placeholder : T('Power Off UPS'),
      tooltip : T('Check this to have the UPS power off after shutting\
       down the FreeNAS system.'),
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) {
    this.ups_driver = _.find(this.fieldConfig, { name: 'ups_driver' });
    this.ws.call('notifier.choices', ['UPSDRIVER_CHOICES']).subscribe((res) => {
      for (let item of res) {
        this.ups_driver.options.push({ label: item[1], value: item[0] });
      }
    });
  }
}
