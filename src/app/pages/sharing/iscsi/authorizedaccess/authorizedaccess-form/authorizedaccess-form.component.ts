import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

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
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_tag,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_tag,
      inputType : 'number',
      min: 0,
      required: true,
      validation : helptext_sharing_iscsi.authaccess_validators_tag
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_user',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_user,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_user,
      validation : helptext_sharing_iscsi.authaccess_validators_user
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_secret',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_secret,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_secret,
      inputType : 'password',
      togglePw: true,
      required: true,
      validation : helptext_sharing_iscsi.authaccess_validators_secret,
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_secret_confirm',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_secret_confirm,
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peeruser',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_peeruser,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_peeruser,
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peersecret',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_peersecret,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_peersecret,
      inputType : 'password',
      togglePw: true,
      validation : helptext_sharing_iscsi.authaccess_validators_peersecret,
    },
    {
      type : 'input',
      name : 'iscsi_target_auth_peersecret_confirm',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_peersecret_confirm,
      inputType : 'password'
    },
  ];

  constructor(protected router: Router) {}

  afterInit(entityAdd: any) {}
}
