import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

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
      tooltip: 'Use <i>ALL</i> keyword or a list of initiator hostnames\
 separated by spaces.',
      value : 'ALL',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_auth_network',
      placeholder : 'Authorized Network',
      tooltip: 'Use <i>ALL</i> keyword or a network address with CIDR\
 mask such as <i>192.168.2.0/24</i>.',
      value : 'ALL',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_comment',
      placeholder : 'Comment',
      tooltip: 'Optional description.',
    },
  ];

  constructor(protected router: Router) {}

  afterInit(entityAdd: any) {}
}
