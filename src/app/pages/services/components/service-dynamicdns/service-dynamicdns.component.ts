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

import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'dynamicdns-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class ServiceDDNSComponent {
  protected resource_name: string = 'services/dynamicdns';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ddns_provider',
      placeholder : 'Provider',
      tooltip: 'Several providers are supported. If your provider is\
 not listed, select <i>Custom Provider</i> and enter the information in\
 the <i>Custom Server</i> and <i>Custom Path</i> fields.',
      options : [
        {label : 'dyndns.org', value : 'dyndns@dyndns.org'},
        {label : 'freedns.afraid.org', value : 'default@freedns.afraid.org'},
        {label : 'zoneedit.com', value : 'default@zoneedit.com'},
        {label : 'no-ip.com', value : 'default@no-ip.com'},
        {label : 'easydns.com', value : 'default@easydns.com'},
        {label : '3322.org', value : 'dyndns@3322.org'},
        {label : 'sitelutions.com', value : 'default@sitelutions.com'},
        {label : 'dnsomatic.com', value : 'default@dnsomatic.com'},
        {label : 'he.net', value : 'default@he.net'},
        {label : 'tzo.com', value : 'default@tzo.com'},
        {label : 'dynsip.org', value : 'default@dynsip.org'},
        {label : 'dhis.org', value : 'default@dhis.org'},
        {label : 'majimoto.net', value : 'default@majimoto.net'},
        {label : 'zerigo', value : 'default@zerigo.com'},
      ]
    },
    {
      type : 'input',
      name : 'ddns_ipserver',
      placeholder : 'IP Server',
      tooltip: 'Enter the name and port of the server that reports the\
 external IP address in the format <i>server.name.org:port</i>.',
    },
    {
      type : 'input',
      name : 'ddns_domain',
      placeholder : 'Domain name',
      tooltip: 'Fully qualified domain name (e.g.\
 <i>yourname.dyndns.org</i>).',
    },
    {
      type : 'input',
      name : 'ddns_username',
      placeholder : 'User name',
      tooltip: 'Username used to logon to the provider and update the\
 record.',
    },
    {
      type : 'input',
      name : 'ddns_password',
      placeholder : 'Password',
      tooltip: 'Password used to logon to the provider and update the\
 record.',
      inputType : 'password',
      validation :
          [ Validators.minLength(8), matchOtherValidator('ddns_password2') ]
    },
    {
      type : 'input',
      name : 'ddns_password2',
      placeholder : 'Confirm Password',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'ddns_updateperiod',
      placeholder : 'Update Period',
      tooltip: 'How often the IP is checked in seconds.',
    },
    {
      type : 'input',
      name : 'ddns_fupdateperiod',
      placeholder : 'Forced Update Period',
    },
    {
      type : 'input',
      name : 'lldp_location',
      placeholder : 'Auxiliary Parameters',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { }
}
