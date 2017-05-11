import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';

@Component({
	selector: 'app-jail-add',
	template: `<entity-add [conf]="this"></entity-add>`
})
export class JailAddComponent {

	protected resource_name: string = 'jails/jails';
  protected route_success: string[] = ['jails', 'jails'];
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jail_host',
      label: 'Jails Name',
    })
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
    
  }
}