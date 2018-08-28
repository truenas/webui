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
  IdmapService,
  IscsiService,
  RestService,
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
  selector : 'snmp-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, IdmapService ],
})

export class ServiceSNMPComponent {
  protected resource_name: string = 'services/snmp';
  protected addCall: string = 'snmp.update';
  protected route_success: string[] = [ 'services' ];
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'location',
      placeholder : T('Location'),
      tooltip: T('Enter the location of the system.'),
      label : 'Location',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'contact',
      placeholder : T('Contact'),
      tooltip: T('Enter an email address to receive messages from the\
                  <a href="..//docs/services.html#snmp"\
                  target="_blank">SNMP service</a>.'),
      required: true,
      validation: [Validators.required, Validators.email]
    },
    {
      type : 'input',
      name : 'community',
      placeholder : T('Community'),
      tooltip: T('Change from <i>public</i to increase system security.\
                  Can only contain alphanumeric characters, underscores,\
                  dashes, periods, and spaces. This can be left empty\
                  for <i>SNMPv3</i> networks.'),
      validation: [Validators.pattern(/^[\w\_\-\.\s]*$/)]
    },
    {
      type : 'checkbox',
      name : 'v3',
      placeholder : T('SNMP v3 Support'),
      tooltip: T('Set to to enable support for <a\
                  href="https://tools.ietf.org/html/rfc3410"\
                  target="_blank">SNMP version 3</a>. See <a\
                  href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
                  target="_blank">snmpd.conf(5)</a> for configuration\
                  details.'),
    },
    {
      type : 'input',
      name : 'v3_username',
      placeholder : T('Username'),
      tooltip: T('Enter a username to register with this service.'),
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ]
    },
    {
      type : 'select',
      name : 'v3_authtype',
      placeholder : T('Authentication Type'),
      tooltip: T('Choose an authentication method.'),
      options : [
        {label : '---', value : ""}, {label : 'MD5', value : 'MD5'},
        {label : 'SHA', value : 'SHA'}
      ],
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ],
    },
    {
      type : 'input',
      name : 'v3_password',
      inputType : 'password',
      placeholder : T('Password'),
      togglePw: true,
      tooltip: T('Enter a password of at least eight characters.'),
      required: true,
      validation :
          [ Validators.minLength(8), matchOtherValidator('v3_password2'), Validators.required ],
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'v3_password2',
      inputType : 'password',
      placeholder : T('Confirm Password'),
      required: true,
      validation: [ Validators.required ],
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ]
    },
    {
      type : 'select',
      name : 'v3_privproto',
      placeholder : T('Privacy Protocol'),
      tooltip: T('Choose a privacy protocol.'),
      options : [
        {label : '---', value : null},
        {label : 'AES', value : 'AES'},
        {label : 'DES', value : 'DES'},
      ],
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'v3_privpassphrase',
      inputType : 'password',
      togglePw: true,
      placeholder : T('Privacy Passphrase'),
      tooltip: T('Enter a separate privacy passphrase. <b>Password</b>\
                  is used when this is left empty.'),
      validation : [
        Validators.minLength(8), matchOtherValidator('v3_privpassphrase2')
      ],
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'v3_privpassphrase2',
      inputType : 'password',
      placeholder : T('Confirm Privacy Passphrase'),
      relation : [ {
        action : 'HIDE',
        when : [ {name : 'v3', value : false} ]
      } ]
    },
    {
      type : 'textarea',
      name : 'options',
      placeholder : T('Auxiliary Parameters'),
      tooltip: T('Enter any additional <a\
                  href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
                  target="_blank">snmpd.conf(5)</a> options. Add one\
                  option for each line.'),
    },
    {
      type : 'select',
      name : 'loglevel',
      placeholder : T('Log Level'),
      tooltip : T('Choose how many log entries to create. Choices range\
                   from the least log entries (<i>Emergency</i>) to the\
                   most (<i>Debug</i>).'),
      options : [
        {label : 'Emergency', value :0},
        {label : 'Alert', value :1},
        {label : 'Critical', value :2},
        {label : 'Error', value :3},
        {label : 'Warning', value :4},
        {label : 'Notice', value :5},
        {label : 'Info', value :6},
        {label : 'Debug', value :7},
      ]
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected iscsiService: IscsiService,
              protected idmapService: IdmapService) {}

  afterInit(entityForm: any) {
    entityForm.ws.call('snmp.config').subscribe((res)=>{
      entityForm.formGroup.controls['location'].setValue(res.location);
      entityForm.formGroup.controls['contact'].setValue(res.contact);
      entityForm.formGroup.controls['community'].setValue(res.community);
      entityForm.formGroup.controls['v3'].setValue(res.v3);
      entityForm.formGroup.controls['v3_username'].setValue(res.v3_username);
      entityForm.formGroup.controls['v3_privproto'].setValue(res.v3_privproto);
      entityForm.formGroup.controls['options'].setValue(res.options);
      entityForm.formGroup.controls['loglevel'].setValue(res.loglevel);
      entityForm.formGroup.controls['v3_password'].setValue(res.v3_password);
      entityForm.formGroup.controls['v3_password2'].setValue(res.v3_password);
      entityForm.formGroup.controls['v3_privpassphrase'].setValue(res.v3_privpassphrase);
      entityForm.formGroup.controls['v3_privpassphrase2'].setValue(res.v3_privpassphrase);
      entityForm.formGroup.controls['v3_authtype'].setValue(res.v3_authtype);
    });
    entityForm.submitFunction = this.submitFunction;
   }

  clean(value) {
    delete value['v3_privpassphrase2'];
    delete value['v3_password2'];
    if (!value['v3']){
      value['v3_password'] = "";
      value['v3_privpassphrase'] = "";
      value['v3_privproto'] = null;
      value['v3_authtype'] = "";


    }

    return value;
  }

  submitFunction(this: any, entityForm: any,){

    return this.ws.call('snmp.update', [entityForm]);

  }
}
