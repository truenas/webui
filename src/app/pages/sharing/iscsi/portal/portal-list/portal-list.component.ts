import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalState } from '../../../../../global.state';
import { RestService, WebSocketService } from '../../../../../services/';
import { Subscription } from 'rxjs';

import { EntityListComponent } from '../../../../common/entity/entity-list/';

@Component({
  selector: 'app-iscsi-portal-list',
  template: `
  <entity-list [conf]="this"></entity-list>
  `
})
export class PortalListComponent {

  protected resource_name: string = 'services/iscsi/portal';
  protected route_add: string[] = ['sharing', 'iscsi', 'portals', 'add'];
  protected route_delete: string[] = ['sharing', 'iscsi', 'portals', 'delete'];
  protected route_edit: string[] = ['sharing', 'iscsi', 'portals', 'edit'];
  protected entityList: EntityListComponent;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  public columns:Array<any> = [
    {title: 'Portal Group ID', name: 'iscsi_target_portal_tag'},
    {title: 'Listen', name: 'iscsi_target_portal_ips'},
    {title: 'Comment', name: 'iscsi_target_portal_comment'},
    {title: 'Discovery Auth Method', name: 'iscsi_target_portal_discoveryauthmethod'},
    {title: 'Discovery Auth Group', name: 'iscsi_target_portal_discoveryauthgroup'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  afterInit(entityList: EntityListComponent) {
    this.entityList = entityList;
  }
}
