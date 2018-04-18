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
  selector : 'domaincontroller-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceDCComponent {
  protected resource_name: string = 'services/domaincontroller';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'dc_realm',
      label : 'Realm',
      placeholder : T('Realm'),
      tooltip: T('Capitalized DNS realm name.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'dc_domain',
      label : 'Domain',
      placeholder : T('Domain'),
      tooltip: T('Capitalized domain name.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'dc_role',
      label : 'Server Role',
      placeholder : T('Server Role'),
      tooltip: T('At this time, the only supported role is as the domain\
       controller for a new domain.'),
      options : [
        {label : 'DC', value : 'dc'},
      ],
    },
    {
      type : 'input',
      name : 'dc_dns_forwarder',
      label : 'DNS Forwarder',
      placeholder : T('DNS Forwarder'),
      tooltip: T('IP address of DNS forwarder. Required for recursive\
       queries when <i>SAMBA_INTERNAL</i> is selected.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'dc_forest_level',
      label : 'Domain Forest Level',
      placeholder : T('Domain Forest Level'),
      tooltip: T('Choices are <i>2000, 2003, 2008, 2008_R2, 2012,</i> or <i>2012_R2</i>.\
       Refer to <a\
       href="https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/active-directory-functional-levels"\
       target="_blank">Understanding Active Directory Domain Services (AD DS)\
       Functional Levels</a> for details.'),
      options : [
        {label : '2000', value : '2000'},
        {label : '2003', value : '2003'},
        {label : '2008', value : '2008'},
        {label : '2008_R2', value : '2008_R2'},
        {label : '2012', value : '2012'},
        {label : '2012_R2', value : '2012_R2'},
      ],
    },
    {
      type : 'input',
      name : 'dc_passwd',
      inputType : 'password',
      placeholder : T('Administrator Password'),
      tooltip: T('Password to be used for the\
       <a href="http://doc.freenas.org/11/directoryservice.html#active-directory"\
       target="_blank">Active Directory</a> administrator account.'),
      validation :
          [ Validators.minLength(8), matchOtherValidator('dc_passwd2') ]
    },
    {
      type : 'input',
      name : 'dc_passwd2',
      inputType : T('password'),
      placeholder : T('Confirm password'),
    },
    {
      type : 'select',
      name : 'afp_srv_map_acls',
      label : 'Kerberos Realm:',
      placeholder : T('Kerberos Realm'),
      tooltip : T('Auto-populates with information from the <b>Realm</b>\
       when the settings in this screen are saved.'),
      options : [
        {label : 'Rights', value : 'rights'},
        {label : 'None', value : 'none'},
        {label : 'Mode', value : 'mode'},
      ],
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { }
}
