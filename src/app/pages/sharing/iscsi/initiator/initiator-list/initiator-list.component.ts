import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';

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

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService) {}

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
