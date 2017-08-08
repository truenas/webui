import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';
import {EntityListComponent} from '../../../../common/entity/entity-list/';

@Component({
  selector : 'app-iscsi-authorizedaccess-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class AuthorizedAccessListComponent {

  protected resource_name: string = 'services/iscsi/authcredential';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'auth', 'add' ];
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'auth', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'auth', 'edit' ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService) {}

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

  afterInit(entityList: EntityListComponent) {}
}
