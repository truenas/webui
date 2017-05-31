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
    selector: 'smart-edit',
    template: ` <entity-config [conf]="this"></entity-config>`
})

export class ServiceSMARTComponent {
  protected resource_name: string = 'services/smart';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services','smartd'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'smart_interval',
      label: 'Check Interval',
    }),
    new DynamicSelectModel({
      id: 'smart_powermode',
      label: 'Power Mode',
      options: [
        { label: 'Never', value: 'never'},
        { label: 'Sleep', value: 'sleep'},
        { label: 'Standby', value: 'standby'},
        { label: 'Idle', value: 'idle'},
      ]
    }),
    new DynamicInputModel({
        id: 'smart_difference',
        label: 'Difference',
    }),
    new DynamicInputModel({
        id: 'smart_informational',
        label: 'Informational',
    }),
    new DynamicInputModel({
        id: 'smart_critical',
        label: 'Critical',
    }),
    new DynamicInputModel({
        id: 'smart_email',
        label: 'Email to Report',
    }),
  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



