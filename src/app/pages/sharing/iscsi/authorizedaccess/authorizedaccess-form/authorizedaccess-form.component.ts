import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

import {
  matchOtherValidator
} from '../../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../../translate-marker';

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
      placeholder : T('Group ID'),
      tooltip: T('Allows different groups to be configured with different\
 authentication profiles. For instance, all users with a group ID of\
 <i>1</i> will inherit the authentication profile associated with Group\
 <i>1</i>.'),
      inputType : 'integer',
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_user',
      placeholder : T('User'),
      tooltip: T('Name of user account to create for CHAP authentication\
 with the user on the remote system. Many initiators default to using\
 the initiator name as the user.'),
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_secret',
      placeholder : T('Secret'),
      tooltip: T('Password to be associated with <b>User</b>. The iSCSI\
 standard requires that this be between 12 and 16 characters.'),
      inputType : 'password',
      validation : [
        Validators.minLength(8),
        matchOtherValidator('iscsi_target_auth_secret_confirm'),
      ],
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_secret_confirm',
      placeholder : T('Secret (Confirm)'),
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peeruser',
      placeholder : T('Peer User'),
      tooltip: T('Only input when configuring mutual CHAP. In most cases\
 it will need to be the same value as <b>User</b>.'),
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peersecret',
      placeholder : T('Peer Secret'),
      tooltip: T('The mutual secret password which\
 <b>must be different than the <i>Secret</i></b>. Required if\
 <b>Peer User</b> is set.'),
      inputType : 'password',
      validation : [
        Validators.minLength(8),
        matchOtherValidator('iscsi_target_auth_peersecret_confirm'),
      ],
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peersecret_confirm',
      placeholder : T('Peer Secret (Confirm)'),
      inputType : 'password',
    },
  ];

  constructor(protected router: Router) {}

  afterInit(entityAdd: any) {}
}
