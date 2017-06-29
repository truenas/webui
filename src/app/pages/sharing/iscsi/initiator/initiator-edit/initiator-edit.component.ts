import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService,
  DynamicInputModel,
  DynamicRadioGroupModel,
  DynamicSelectModel,
  DynamicTextAreaModel
} from '@ng2-dynamic-forms/core';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';

@Component({
  selector : 'app-iscsi-initiator-edit',
  template : `<entity-edit [conf]="this"></entity-edit>`
})
export class InitiatorEditComponent {

  public resource_name: string = 'services/iscsi/authorizedinitiator';
  public route_success: string[] = [ 'sharing', 'iscsi' ];
  public formModel: DynamicFormControlModel[] = [
    new DynamicTextAreaModel({
      id : 'iscsi_target_initiator_initiators',
      label : 'Initiators',
      value : 'ALL',
    }),
    new DynamicTextAreaModel({
      id : 'iscsi_target_initiator_auth_network',
      label : 'Authorized Network',
      value : 'ALL',
    }),
    new DynamicInputModel({
      id : 'iscsi_target_initiator_comment',
      label : 'Comment',
    }),
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected formService: DynamicFormService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityAdd: any) {}
}
