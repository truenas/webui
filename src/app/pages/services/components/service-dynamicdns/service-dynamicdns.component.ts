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
import { T } from '../../../../translate-marker';

@Component({
  selector : 'dynamicdns-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class ServiceDDNSComponent {
  // protected resource_name = 'services/dynamicdns';
  protected addCall = 'dyndns.update';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'provider',
      placeholder : T('Provider'),
      tooltip: T('Several providers are supported. If your provider is\
       not listed, select <i>Custom Provider</i> and enter the information in\
       the <i>Custom Server</i> and <i>Custom Path</i> fields.'),
      options : [
        {label :'dyndns@3322.org',  value :'3322.org'},
        {label :'default@changeip.com',  value :'changeip.com'},
        {label :'default@cloudxns.net',  value :'cloudxns.net'},
        {label :'default@ddnss.de',  value :'ddnss.de'},
        {label :'default@dhis.org',  value :'dhis.org'},
        {label :'default@dnsexit.com',  value :'dnsexit.com'},
        {label :'default@dnsomatic.com',  value :'dnsomatic.com'},
        {label :'default@dnspod.cn',  value :'dnspod.cn'},
        {label :'default@domains.google.com',  value :'domains.google.com'},
        {label :'default@dtdns.com',  value :'dtdns.com'},
        {label :'default@duckdns.org',  value :'duckdns.org'},
        {label :'default@duiadns.net',  value :'duiadns.net'},
        {label :'default@dyndns.org',  value :'dyndns.org'},
        {label :'default@dynsip.org',  value :'dynsip.org'},
        {label :'default@dynv6.com',  value :'dynv6.com'},
        {label :'default@easydns.com',  value :'easydns.com'},
        {label :'default@freedns.afraid.org',  value :'freedns.afraid.org'},
        {label :'default@freemyip.com',  value :'freemyip.com'},
        {label :'default@gira.de',  value :'gira.de'},
        {label :'ipv6tb@he.net',  value :'he.net'},
        {label :'default@ipv4.dynv6.com',  value :'ipv4.dynv6.com'},
        {label :'default@loopia.com',  value :'loopia.com'},
        {label :'default@no-ip.com',  value :'no-ip.com'},
        {label :'ipv4@nsupdate.info',  value :'nsupdate.info'},
        {label :'default@ovh.com',  value :'ovh.com'},
        {label :'default@sitelutions.com',  value :'sitelutions.com'},
        {label :'default@spdyn.de',  value :'spdyn.de'},
        {label :'default@strato.com',  value :'strato.com'},
        {label :'default@tunnelbroker.net', value : 'tunnelbroker.net'},
        {label :'default@tzo.com',  value :'tzo.com'},
        {label :'default@zerigo.com', value : 'zerigo.com'},
        {label :'default@zoneedit.com', value : 'zoneedit.com'},
        {label :'custom', value : 'Custom Provider'},
      ]
    },
    {
      type : 'checkbox',
      name : 'checkip_ssl',
      placeholder : T('CheckIP Server SSL'),
      tooltip: T(''),
    },
    {
      type : 'input',
      name : 'checkip_server',
      placeholder : T('CheckIP Server'),
      tooltip: T('Enter the name and port of the server that reports the\
       external IP address in the format <i>server.name.org:port</i>.'),
    },
    {
      type : 'input',
      name : 'checkip_path',
      placeholder : T('CheckIP Path'),
      tooltip: T(''),
    },
    {
      type : 'checkbox',
      name : '  ssl',
      placeholder : T('CheckIP Server SSL'),
      tooltip: T(''),
    },
    {
      type : 'input',
      name : 'domain',
      placeholder : T('Domain name'),
      tooltip: T(''),
    },
    {
      type : 'input',
      name : 'username',
      placeholder : T('Username'),
      tooltip: T(''),
    },
    {
      type : 'input',
      name : 'password',
      placeholder : T('Password'),
      tooltip: T('Password used to logon to the provider and update the\
       record.'),
      inputType : 'password',
      validation :
          [ Validators.minLength(8), matchOtherValidator('password2') ]
    },
    {
      type : 'input',
      name : 'password2',
      placeholder : T('Confirm Password'),
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'period',
      placeholder : T('Update Period'),
      tooltip: T('How often the IP is checked in seconds.'),
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityForm: any) { }

  submitFunction(this: any, entityForm: any,){

    return this.ws.call('dyndns.update', [entityForm]);

  }
}
