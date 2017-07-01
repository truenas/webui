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

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import {EntityConfigComponent} from '../../../common/entity/entity-config/';
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

  private entityEdit: EntityConfigComponent;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ddns_provider',
      placeholder : 'Provider',
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
    },
    {
      type : 'input',
      name : 'ddns_domain',
      placeholder : 'Domain name',
    },
    {
      type : 'input',
      name : 'ddns_username',
      placeholder : 'User name',
    },
    {
      type : 'input',
      name : 'ddns_password',
      placeholder : 'Password',
      inputType : 'password',
      validation :
          [ Validators.minLength(8), matchOtherValidator('ddns_password2') ]
    },
    {
      type : 'input',
      name : 'ddns_password2',
      placeholder : 'Password',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'ddns_updateperiod',
      placeholder : 'Update Period',
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
              protected _state: GlobalState) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}