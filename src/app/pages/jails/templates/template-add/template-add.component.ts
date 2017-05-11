import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
	selector: 'app-jail-template-add',
	template: `<entity-add [conf]="this"></entity-add>`
})
export class TemplateAddComponent {

	protected resource_name: string = 'jails/templates';
  protected route_success: string[] = ['jails', 'templates'];
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jt_name',
      label: 'Name',
    }),
    new DynamicSelectModel({
      id: 'jt_os',
      label: 'OS',
      options: [
        { label: 'FreeBSD', value: 'FreeBSD' },
        { label: 'Linux', value: 'Linux' },
      ],
    }),
    new DynamicSelectModel({
      id: 'jt_arch',
      label: 'Architecture',
      options: [
        { label: 'x64', value: 'x64' },
        { label: 'x86', value: 'x86' },
      ],
    }),
    new DynamicInputModel({
      id: 'jt_url',
      label: 'URL',
    }),
    new DynamicInputModel({
      id: 'jt_mtree',
      label: 'Mtree',
    }),
    new DynamicCheckboxModel({
      id: 'jt_readonly',
      label: 'Read-only',
    }),
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
    
  }
}