import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

import { Subscription } from 'rxjs';


@Component ({
    selector: 'lldp-edit',
    template: ` <entity-config [conf]="this"></entity-config>`
})

export class ServiceLLDPComponent {
  protected resource_name: string = 'services/lldp';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services','lldp'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicCheckboxModel({
      id: 'lldp_intdesc',
      label: 'Interface Description',
    }),
    new DynamicInputModel({
      id: 'lldp_country',
      label: 'Country Code',
    }),
    new DynamicInputModel({
        id: 'lldp_location',
        label: 'Location',
    }),
  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



