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
      placeholder : 'Realm',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'dc_domain',
      label : 'Domain',
      placeholder : 'Domain',
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'dc_role',
      label : 'Server Roll',
      placeholder : 'Domain',
      options : [
        {label : 'DC', value : 'dc'},
      ],
    },
    {
      type : 'input',
      name : 'dc_dns_forwarder',
      label : 'DNS Forwarder',
      placeholder : 'DNS Forwarder',
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'dc_forest_level',
      label : 'Forest Level',
      placeholder : 'Forest Level',
      options : [
        {label : '2000', value : '2000'},
        {label : '2003', value : '2003'},
        {label : '2008', value : '2008'},
        {label : '2008_R2', value : '2008_R2'},
      ],
    },
    {
      type : 'input',
      name : 'dc_passwd',
      inputType : 'password',
      placeholder : 'Administration Password',
      validation :
          [ Validators.minLength(8), matchOtherValidator('dc_passwd2') ]
    },
    {
      type : 'input',
      name : 'dc_passwd2',
      inputType : 'password',
      placeholder : 'Confirm password',
    },
    {
      type : 'select',
      name : 'afp_srv_map_acls',
      label : 'Kerberos Realm:',
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
