import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-iscsi-authorizedaccess-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class AuthorizedAccessListComponent {

  protected resource_name: string = 'services/iscsi/authcredential';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'auth', 'add' ];
  protected route_add_tooltip: string = "Add Authorized Access";
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'auth', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'auth', 'edit' ];

  constructor(protected router: Router) {}

  public columns: Array<any> = [
    {
      name : 'Group ID',
      prop : 'iscsi_target_auth_tag',
    },
    {
      name : 'User',
      prop : 'iscsi_target_auth_user',
    },
    {
      name : 'Peer User',
      prop : 'iscsi_target_auth_peeruser',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
