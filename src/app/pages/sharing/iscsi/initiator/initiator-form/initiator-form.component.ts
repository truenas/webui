import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../../global.state';

import {EntityFormComponent} from '../../../../common/entity/entity-form';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-iscsi-initiator-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InitiatorFormComponent {

  protected resource_name: string = 'services/iscsi/authorizedinitiator';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'initiator' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'iscsi_target_initiator_initiators',
      placeholder : 'Initiators',
      value : 'ALL',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_auth_network',
      placeholder : 'Authorized Network',
      value : 'ALL',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_comment',
      placeholder : 'Comment',
    },
  ];

  constructor(protected router: Router, protected _injector: Injector,
              protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityAdd: any) {}
}
