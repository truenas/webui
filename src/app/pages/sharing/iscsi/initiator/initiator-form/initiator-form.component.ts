import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

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
      placeholder : helptext_sharing_iscsi.initiator_form_placeholder_initiators,
      tooltip: helptext_sharing_iscsi.initiator_form_tooltip_initiators,
      value : 'ALL',
      inputType : 'textarea',
      required: true,
      validation : helptext_sharing_iscsi.initiator_form_validators_initiators
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_auth_network',
      placeholder : helptext_sharing_iscsi.initiator_form_placeholder_auth_network,
      tooltip: helptext_sharing_iscsi.initiator_form_tooltip_auth_network,
      value : 'ALL',
      inputType : 'textarea',
      required: true,
      validation : helptext_sharing_iscsi.initiator_form_validators_auth_network
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_comment',
      placeholder : helptext_sharing_iscsi.initiator_form_placeholder_comment,
      tooltip: helptext_sharing_iscsi.initiator_form_tooltip_comment,
    },
  ];

  constructor(protected router: Router) {}

  afterInit(entityAdd: any) {}

  resourceTransformIncomingRestData(data) {
    data['iscsi_target_initiator_initiators'] = data['iscsi_target_initiator_initiators'].replace(/\n/g, ' ');
    data['iscsi_target_initiator_auth_network'] = data['iscsi_target_initiator_auth_network'].replace(/\n/g, ' ');
    return data;
  }
}
