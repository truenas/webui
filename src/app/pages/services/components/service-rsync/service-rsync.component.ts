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
    selector: 'rsync-edit',
    template: ` <entity-config [conf]="this"></entity-config>`
})

export class ServiceRSYNCComponent {
  protected resource_name: string = 'services/rsyncd';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services','rsync'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'rsyncd_port',
      label: 'TCP Port',
    }),
    new DynamicInputModel({
      id: 'rsyncd_auxiliary',
      label: 'Auxiliary parameters',
    }),
  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



