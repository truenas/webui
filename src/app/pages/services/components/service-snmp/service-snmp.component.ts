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

@Component({
  selector : 'snmp-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, IdmapService ],
})

export class ServiceSNMPComponent {
  protected resource_name: string = 'services/snmp';
  protected route_success: string[] = [ 'services' ];
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'snmp_location',
      placeholder : 'Location',
      tooltip: 'Optional description of the location of the system.',
      label : 'Location',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'snmp_contact',
      placeholder : 'Contact',
      tooltip: 'Optional email address of administrator.',
    },
    {
      type : 'input',
      name : 'snmp_community',
      placeholder : 'Community',
      tooltip: 'Default is <i>public</i> and <b>should be changed for\
 security reasons;</b> can only contain alphanumeric characters, underscores, dashes,\
 periods, and spaces; this value can be empty for SNMPv3 networks.',
    },
    {
      type : 'checkbox',
      name : 'snmp_traps',
      placeholder : 'SNMP v3 Support',
      tooltip: 'Check this box to enable support for SNMP version 3.',
    },
    {
      type : 'input',
      name : 'snmp_v3_username',
      placeholder : 'Username',
      tooltip: 'Only applies if <b>SNMP v3 Support</b> is checked; specify\
 the username to register with this service; refer to\
 <a href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html" target="_blank">snmpd.conf(5)</a>\
 for more information regarding the configuration of this setting as\
 well as the <b>Authentication Type</b>, <b>Password</b>, <b>Privacy Protocol</b>, and\
 <b>Privacy Passphrase</b> fields.',
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'select',
      name : 'snmp_v3_authtype',
      label : 'Authentic Type',
      tooltip: 'Only applies if <b>SNMP v3 Support</b> is checked;\
 choices are <i>MD5</i> or </i>SHA</i>.',
      options : [
        {label : '---', value : null}, {label : 'MD5', value : 'MD5'},
        {label : 'SHA', value : 'SHA'}
      ],
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'snmp_v3_password',
      inputType : 'password',
      placeholder : 'password',
      tooltip: 'Only applies if <b>SNMP v3 Support</b> is checked; specify\
 and confirm a password of at least eight characters.',
      validation :
          [ Validators.minLength(8), matchOtherValidator('snmp_v3_password2') ],
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'snmp_v3_password2',
      inputType : 'password',
      placeholder : 'Confirm password',
      tooltip: 'Re-enter <b>Password</b> to confirm.',
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'select',
      name : 'snmp_v3_privproto',
      label : 'Privacy Protocol',
      tooltip: 'Only applies if <b>SNMP v3 Support<b> is\
 checked; choices are <i>AES</i> or <i>DES</i>.',
      options : [
        {label : '---', value : null},
        {label : 'AES', value : 'AES'},
        {label : 'DES', value : 'DES'},
      ],
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'snmp_v3_privpassphrase',
      inputType : 'password',
      placeholder : 'Privacy Passphrase',
      tooltip:'If not specified, <b>Password</b> is used.',
      validation : [
        Validators.minLength(8), matchOtherValidator('snmp_v3_privpassphrase2')
      ],
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'input',
      name : 'snmp_v3_privpassphrase2',
      inputType : 'password',
      placeholder : 'Confirm Privacy Passphrase',
      tooltip: 'Re-enter <b>Privacy Passphrase</b> to confirm.',
      relation : [ {
        action : 'DISABLE',
        when : [ {name : 'snmp_traps', value : false} ]
      } ]
    },
    {
      type : 'textarea',
      name : 'snmp_options',
      placeholder : 'Auxiliary Parameters',
      tooltip: 'Additional <a href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html" target="_blank">snmpd.conf(5)</a>\
 options not covered in this screen, one per line.',
    },
  ];

  ngOnInit() {}

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected iscsiService: IscsiService,
              protected idmapService: IdmapService) {}

  afterInit(entityEdit: any) { }
}