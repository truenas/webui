import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-iscsi-initiator-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class InitiatorListComponent {

  protected resource_name: string = 'services/iscsi/authorizedinitiator';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'initiators', 'add' ];
  protected route_add_tooltip: string = "Add Initiator";
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'initiators', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'initiators', 'edit' ];

  constructor(protected router: Router) {}

  public columns: Array<any> = [
    {
      name : 'Group ID',
      prop : 'iscsi_target_initiator_tag',
    },
    {
      name : 'Initiators',
      prop : 'iscsi_target_initiator_initiators',
    },
    {
      name : 'Authorized Network',
      prop : 'iscsi_target_initiator_auth_network',
    },
    {
      name : 'Comment',
      prop : 'iscsi_target_initiator_comment',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityList: any) {}
}
