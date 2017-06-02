import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../../global.state';
import { RestService, WebSocketService } from '../../../../../services/';

@Component({
  selector: 'app-iscsi-authorizedaccess-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class AuthorizedAccessAddComponent {

  protected resource_name: string = 'services/iscsi/authcredential';
  protected route_success: string[] = ['sharing', 'iscsi'];
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'iscsi_target_auth_tag',
      label: 'Group ID',
      inputType: 'integer',
    }),
    new DynamicInputModel({
      id: 'iscsi_target_auth_user',
      label: 'User',
    }),
    new DynamicInputModel({
      id: 'iscsi_target_auth_secret',
      label: 'Secret',
      inputType: 'password',
    }),
    // new DynamicInputModel({
    //   id: 'iscsi_target_auth_secret_confirm',
    //   label: 'Secret (Confirm)',
    //   inputType: 'password',
    // }),
    new DynamicInputModel({
      id: 'iscsi_target_auth_peeruser',
      label: 'Peer User',
    }),
    new DynamicInputModel({
      id: 'iscsi_target_auth_peersecret',
      label: 'Peer Secret',
      inputType: 'password',
    }),
    // new DynamicInputModel({
    //   id: 'iscsi_target_auth_peersecret_confirm',
    //   label: 'Peer Secret (Confirm)',
    //   inputType: 'password',
    // }),
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
  }
}
