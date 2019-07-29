import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-iscsi-authorizedaccess-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class AuthorizedAccessListComponent {

  protected queryCall = 'iscsi.auth.query';
  protected wsDelete = 'iscsi.auth.delete';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'auth', 'add' ];
  protected route_add_tooltip: string = "Add Authorized Access";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'auth', 'edit' ];

  public columns: Array<any> = [
    {
      name : 'Group ID',
      prop : 'tag',
      always_display: true
    },
    {
      name : 'User',
      prop : 'user',
    },
    {
      name : 'Peer User',
      prop : 'peeruser',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Authorized Access',
      key_props: ['tag']
    },
  };

  constructor(protected router: Router) {}

}
