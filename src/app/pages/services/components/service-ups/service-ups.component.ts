import {ApplicationRef, Component, Injector, OnDestroy} from '@angular/core';
import {Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';


import {RestService,WebSocketService} from '../../../../services/';
import {FieldConfig} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { number } from 'style-value-types';

@Component({
  selector : 'app-ups-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceUPSComponent implements OnDestroy {
  protected ups_driver: any;
  protected ups_driver_fg: any;
  protected ups_port: any;
  protected ups_hostname: any;
  protected ups_driver_subscription: any;
  protected entityForm: any;
  protected ups_mode_fg: any;

  protected resource_name  = 'services/ups';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ups_mode',
      placeholder : T('UPS Mode'),
      tooltip : T('Choose <i>Master</i> if the UPS is plugged directly\
                   into the system serial port. The UPS will remain the\
                   last item to shut down. Choose <i>Slave</i> to have\
                   this system shut down before <i>Master</i>. See the\
                   <a href="http://networkupstools.org/docs/user-manual.chunked/ar01s02.html#_monitoring_client"\
                   target="_blank">Network UPS Tools Overview</a>.'),
      options : [
        {label : 'Master', value : 'master'},
        {label : 'Slave', value : 'slave'},
      ]
    },
    {
      type : 'input',
      name : 'ups_identifier',
      placeholder : T('Identifier'),
      tooltip : T('Describe the UPS device. It can contain alphanumeric,\
                   period, comma, hyphen, and underscore characters.'),
      required: true,
    validation : [ Validators.required, Validators.pattern(/^[\w|,|\.|\-|_]+$/) ]
    },
    {
      type : 'input',
      name : 'ups_remotehost',
      placeholder : T('Remote Host'),
      tooltip : T('IP address of the remote system with <i>UPS Mode</i>\
                   set as <i>Master</i>. Enter a valid IP address in\
                   the format <i>192.168.0.1</i>.'),
      required: true,
      isHidden: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ups_remoteport',
      placeholder : T('Remote Port'),
      tooltip : T('The open network port of the remote system with\
                   <i>UPS Mode</i> set as <i>Master</i>. Enter a valid\
                   port number that has been configured for use on the\
                   Master system. <i>3493</i> is the default port used.'),
      value : 3493,
      required: true,
      isHidden: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'ups_driver',
      placeholder : T('Driver'),
      tooltip : T('See the <a\
                   href="http://networkupstools.org/stable-hcl.html"\
                   target="_blank">Network UPS Tools compatibility\
                   list</a> for a list of supported UPS devices.'),
      required: true,
      options: [],
      validation : [ Validators.required ],
      isHidden: false
    },
    {
      type : 'select',
      name : 'ups_port',
      placeholder : T('Port'),
      options: [],
      tooltip : T('Enter the serial or USB port the UPS is plugged into.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: false
    },
    {
      type: 'input',
      name: 'ups_hostname',
      placeholder: T('Hostname'),
      tooltip: T('Enter the IP address or hostname for SNMP UPS.'),
      required: true,
    },
    {
      type : 'textarea',
      name : 'ups_options',
      placeholder : T('Auxiliary Parameters (ups.conf)'),
      tooltip : T('Enter any extra options from <a\
                   href="http://networkupstools.org/docs/man/ups.conf.html"\
                   target="_blank">UPS.CONF(5)</a>.'),
      isHidden: false
    },
    {
      type : 'textarea',
      name : 'ups_optionsupsd',
      placeholder : T('Auxiliary Parameters (upsd.conf)'),
      tooltip : T('Enter any extra options from <a\
                   href="http://networkupstools.org/docs/man/upsd.conf.html"\
                   target="_blank">UPSD.CONF(5)</a>.'),
    },
    {
      type : 'input',
      name : 'ups_description',
      placeholder : T('Description'),
      tooltip : T('Describe this service.'),
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
                   before initiating shutdown. Shutdown will not occur\
                   if power is restored while the timer is counting\
                   down. This value only applies when <b>Shutdown\
                   mode</b> is set to <i>UPS goes on battery</i>.'),
    },
    {
      type : 'input',
      name : 'ups_shutdowncmd',
      placeholder : T('Shutdown Command'),
      tooltip : T('Enter a command to shut down the system when either\
                   battery power is low or the shutdown timer ends.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'ups_nocommwarntime',
      placeholder: T('No Communication Warning Time'),
      tooltip: T('Enter a number of seconds to wait before alerting that\
                  the service cannot reach any UPS. Warnings continue\
                  until the situation is fixed.'),
      value: `300`,
    },
    {
      type : 'input',
      name : 'ups_monuser',
      placeholder : T('Monitor User'),
      tooltip : T('Enter a user to associate with this service. Keeping\
                   the default is recommended.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ups_monpwd',
      inputType: 'password',
      togglePw: true,
      placeholder : T('Monitor Password'),
      tooltip : T('Change the default password to improve system\
                   security. The new password cannot contain a\
                   space or <b>#</b> .'),
      validation: [Validators.pattern(/^((?![\#|\s]).)*$/)]
    },
    {
      type : 'textarea',
      name : 'ups_extrausers',
      placeholder : T('Extra Users(upsd.conf)'),
      tooltip : T('Enter accounts that have administrative access.\
                   See <a\
                   href="http://networkupstools.org/docs/man/upsd.users.html"\
                   target="_blank">upsd.users(5)</a> for examples.'),
    },
    {
      type : 'checkbox',
      name : 'ups_rmonitor',
      placeholder : T('Remote Monitor'),
      tooltip : T('Set for the default configuration to listen on all\
                   interfaces using the known values of user:\
                   <i>upsmon</i> and password: <i>fixmepass</i>.'),
    },
    {
      type : 'checkbox',
      name : 'ups_emailnotify',
      placeholder : T('Send Email Status Updates'),
      tooltip : T('Set enable sending messages to the address defined in\
                   the <b>Email</b> field.'),
    },
    {
      type : 'input',
      name : 'ups_toemail',
      placeholder : T('Email'),
      tooltip : T('Enter any email addresses to receive status updates.\
                   Separate multiple addresses with a <b>;</b> .'),
    },
    {
      type : 'input',
      name : 'ups_subject',
      placeholder : T('Email Subject'),
      tooltip : T('Enter the subject for status emails.'),
    },
    {
      type : 'checkbox',
      name : 'ups_powerdown',
      placeholder : T('Power Off UPS'),
      tooltip : T('Set for the UPS to power off after shutting down the\
                   system.'),
    },
    {
      type : 'input',
      inputType: 'number',
      name : 'ups_hostsync',
      placeholder : T('Power Off UPS'),
      tooltip : T('Upsmon will wait up to this many seconds in master mode for \
                  the slaves to disconnect during a shutdown situation'),
      value: 15,
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  resourceTransformIncomingRestData(data) {
    if (this.isSNMP(data['ups_driver'])) {
      data['ups_hostname'] = data['ups_port'];
      delete data['ups_port'];
    }
    return data;
  }

  beforeSubmit(data) {
    if (this.isSNMP(data['ups_driver'])) {
      data['ups_port'] = data['ups_hostname'];
    }
    delete data['ups_hostname'];
  }

  isSNMP(value) {
    if (value && value.indexOf('snmp-ups') !== -1) {
      return true;
    }
    return false;
  }

  switchSNMP(value) {
    const is_snmp = this.isSNMP(value);
    this.entityForm.setDisabled('ups_port', is_snmp, is_snmp);
    this.entityForm.setDisabled('ups_hostname', !is_snmp, !is_snmp);
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.ups_mode_fg = entityForm.formGroup.controls['ups_mode'];
    this.ups_mode_fg.valueChanges.subscribe((value) => {
      if (value === "slave") {
        this.entityForm.setDisabled('ups_driver', true);
        this.entityForm.setDisabled('ups_port', true);
        this.entityForm.setDisabled('ups_remotehost', false);
        _.find(this.fieldConfig, { name: 'ups_driver' })['isHidden'] = true;
        _.find(this.fieldConfig, { name: 'ups_port' })['isHidden'] = true;
        _.find(this.fieldConfig, { name: 'ups_remotehost' })['isHidden'] = false;
        _.find(this.fieldConfig, { name: 'ups_remoteport' })['isHidden'] = false;
        _.find(this.fieldConfig, { name: 'ups_options' })['isHidden'] = true;
      } else {
        this.entityForm.setDisabled('ups_driver', false);
        this.entityForm.setDisabled('ups_port', false);
        this.entityForm.setDisabled('ups_remotehost', true);
        _.find(this.fieldConfig, { name: 'ups_driver' })['isHidden'] = false;
        _.find(this.fieldConfig, { name: 'ups_port' })['isHidden'] = false;
        _.find(this.fieldConfig, { name: 'ups_remotehost' })['isHidden'] = true;
        _.find(this.fieldConfig, { name: 'ups_remoteport' })['isHidden'] = true;
        _.find(this.fieldConfig, { name: 'ups_options' })['isHidden'] = false;

      }

    })
    this.entityForm = entityForm;
    this.ups_driver = _.find(this.fieldConfig, { name: 'ups_driver' });
    this.ups_port = _.find(this.fieldConfig, { name: 'ups_port' });
    this.ups_driver_fg = entityForm.formGroup.controls['ups_driver'];
    this.ups_hostname = _.find(this.fieldConfig, {name: 'ups_hostname'});

   this.switchSNMP(this.ups_driver_fg.value);

    this.ups_driver_subscription = this.ups_driver_fg.valueChanges.subscribe((value) => {
      if (value) {
        this.switchSNMP(value);
      }
    });

    this.ws.call('ups.driver_choices', []).subscribe((res) => {
      for (const item in res) {
        this.ups_driver.options.push({ label: res[item], value: item });
      }
    });

    this.ws.call('ups.port_choices', []).subscribe((res) => {
      for (let i=0; i < res.length; i++) {
        this.ups_port.options.push({label: res[i], value: res[i]});
      }
    });
  }

  ngOnDestroy() {
    this.ups_driver_subscription.unsubscribe();
  }
}
