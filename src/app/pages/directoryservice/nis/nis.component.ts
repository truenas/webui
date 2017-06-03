import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, 
         DynamicTextAreaModel } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../common/entity/entity-config/';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, SystemGeneralService } from '../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'nis',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class NISComponent {
  // Form Layout
  protected resource_name: string = 'directoryservice/nis/';
  private entityEdit: EntityConfigComponent;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'nis_domain',
      label: 'NIS domain:'
    }),
    new DynamicInputModel({
      id: 'nis_servers',
      label: 'NIS servers:'
    }),
    new DynamicCheckboxModel({
      id: 'nis_secure_mode',
      label: ' Secure mode',
    }),
    new DynamicCheckboxModel({
      id: 'nis_manycast',
      label: ' Manycast',
    }),
   new DynamicCheckboxModel({
      id: 'nis_enable',
      label: ' Enable',
    }),
  ];
  

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, 
              protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef:
              ApplicationRef, protected _state: GlobalState, protected systemGeneralService: SystemGeneralService) {

              }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



