import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-bootenv-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class BootEnvironmentAddComponent {

  protected route_success: string[] = ['system', 'bootenv'];
  protected resource_name: string = 'system/bootenv';
  protected formModel: DynamicFormControlModel[] = [
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _state: GlobalState) {
  }

  afterInit(entityAdd: any) {
  }

}
