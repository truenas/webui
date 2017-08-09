import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';

@Component({
  selector : 'app-iscsi-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class TargetListComponent {

  protected resource_name: string = 'services/iscsi/target';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'target', 'add' ];
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'target', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'target', 'edit' ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {
      name : 'Target Name',
      prop : 'iscsi_target_name',
    },
    {
      name : 'Target Alias',
      prop : 'iscsi_target_alias',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityList: any) {}
}
