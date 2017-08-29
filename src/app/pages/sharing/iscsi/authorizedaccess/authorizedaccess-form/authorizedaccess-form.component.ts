import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../../global.state';

import {EntityFormComponent} from '../../../../common/entity/entity-form';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';

import {
  matchOtherValidator
} from '../../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'app-iscsi-authorizedaccess-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AuthorizedAccessFormComponent {

  protected resource_name: string = 'services/iscsi/authcredential';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'auth' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'iscsi_target_auth_tag',
      placeholder : 'Group ID',
      inputType : 'integer',
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_user',
      placeholder : 'User',
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_secret',
      placeholder : 'Secret',
      inputType : 'password',
      validation : [
        Validators.minLength(8),
        matchOtherValidator('iscsi_target_auth_secret_confirm'),
      ],
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_secret_confirm',
      placeholder : 'Secret (Confirm)',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peeruser',
      placeholder : 'Peer User',
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peersecret',
      placeholder : 'Peer Secret',
      inputType : 'password',
      validation : [
        Validators.minLength(8),
        matchOtherValidator('iscsi_target_auth_peersecret_confirm'),
      ],
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peersecret_confirm',
      placeholder : 'Peer Secret (Confirm)',
      inputType : 'password',
    },
  ];

  constructor(protected router: Router, protected _injector: Injector,
              protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityAdd: any) {}
}
