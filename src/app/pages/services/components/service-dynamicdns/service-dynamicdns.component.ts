import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component ({
    selector: 'dynamicdns-edit',
    template: ` <entity-config [conf]="this"></entity-config>`
})

export class ServiceDDNSComponent {
  protected resource_name: string = 'services/dynamicdns';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicSelectModel({
      id: 'ddns_provider',
      label: 'Provider',
      options: [
        { label: 'dyndns.org', value: 'dyndns@dyndns.org'},
        { label: 'freedns.afraid.org', value: 'default@freedns.afraid.org'},
        { label: 'zoneedit.com', value: 'default@zoneedit.com'},
        { label: 'no-ip.com', value: 'default@no-ip.com'},
        { label: 'easydns.com', value: 'default@easydns.com'},
        { label: '3322.org', value: 'dyndns@3322.org'},
        { label: 'sitelutions.com', value: 'default@sitelutions.com'},
        { label: 'dnsomatic.com', value: 'default@dnsomatic.com'},
        { label: 'he.net', value: 'default@he.net'},
        { label: 'tzo.com', value: 'default@tzo.com'},
        { label: 'dynsip.org', value: 'default@dynsip.org'},
        { label: 'dhis.org', value: 'default@dhis.org'},
        { label: 'majimoto.net', value: 'default@majimoto.net'},
        { label: 'zerigo', value: 'default@zerigo.com'},
      ]
    }),
    new DynamicInputModel({
      id: 'ddns_ipserver',
      label: 'IP Server',
    }),
    new DynamicInputModel({
        id: 'ddns_domain',
        label: 'Domain name',
    }),
    new DynamicInputModel({
        id: 'ddns_username',
        label: 'User name',
    }),
    new DynamicInputModel({
        id: 'ddns_password',
        label: 'Password',
    }),
    new DynamicInputModel({
        id: 'ddns_updateperiod',
        label: 'Update Period',
    }),
    new DynamicInputModel({
        id: 'ddns_fupdateperiod',
        label: 'Forced Update Period',
    }),
    new DynamicTextAreaModel({
        id: 'lldp_location',
        label: 'Auxiliary Parameters',
    }),
  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}