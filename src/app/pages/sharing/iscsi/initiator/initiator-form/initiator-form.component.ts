import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../../translate-marker';

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
      placeholder : T('Initiators'),
      tooltip: T('Use <i>ALL</i> keyword or a list of initiator hostnames\
                  separated by spaces.'),
      value : 'ALL',
      inputType : 'textarea',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_auth_network',
      placeholder : T('Authorized Network'),
      tooltip: T('Network addresses that can use this initiator. Use\
                  <i>ALL</i> or list network addresses with a\
                  <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing"\
                  target="_blank">CIDR</a> mask. Separate multiple\
                  addresses with a space:\
                  <i>192.168.2.0/24 192.168.2.1/12</i>.'),
      value : 'ALL',
      inputType : 'textarea',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'iscsi_target_initiator_comment',
      placeholder : T('Comment'),
      tooltip: T('Optional description.'),
    },
  ];

  constructor(protected router: Router) {}

  afterInit(entityAdd: any) {}

  resourceTransformIncomingRestData(data) {
    data['iscsi_target_initiator_auth_network'] = data['iscsi_target_initiator_auth_network'].replace(/\n/g, ' ');
    return data;
  }
}
