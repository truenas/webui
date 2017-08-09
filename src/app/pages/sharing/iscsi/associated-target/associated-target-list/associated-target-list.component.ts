import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';

@Component({
  selector : 'app-iscsi-associated-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class AssociatedTargetListComponent {

  protected resource_name: string = 'services/iscsi/targettoextent';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'add' ];
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'edit' ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {
      name : 'Target',
      prop : 'iscsi_target',
    },
    {
      name : 'LUN ID',
      prop : 'iscsi_lunid',
    },
    {
      name : 'Extent',
      prop : 'iscsi_extent',
    }
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityList: any) {}
}
