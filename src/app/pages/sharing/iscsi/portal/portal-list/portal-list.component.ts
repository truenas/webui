import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-iscsi-portal-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class PortalListComponent {

  protected resource_name: string = 'services/iscsi/portal';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'portals', 'add' ];
  protected route_add_tooltip: string = "Add Portal";
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'portals', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'portals', 'edit' ];

  constructor(protected router: Router) {}

  public columns: Array<any> = [
    {
      name : 'Portal Group ID',
      prop : 'iscsi_target_portal_tag',
    },
    {
      name : 'Listen',
      prop : 'iscsi_target_portal_ips',
    },
    {
      name : 'Comment',
      prop : 'iscsi_target_portal_comment',
    },
    {
      name : 'Discovery Auth Method',
      prop : 'iscsi_target_portal_discoveryauthmethod',
    },
    {
      name : 'Discovery Auth Group',
      prop : 'iscsi_target_portal_discoveryauthgroup',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
