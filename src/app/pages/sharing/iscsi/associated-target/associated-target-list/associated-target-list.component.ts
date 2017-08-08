import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';

@Component({
  selector : 'app-iscsi-associated-target-list',
  template : `
  <entity-list [conf]="this"></entity-list>
  `
})
export class AssociatedTargetListComponent {

  protected resource_name: string = 'services/iscsi/targettoextent';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'add' ];
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'edit' ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {title : 'Target', name : 'iscsi_target'},
    {title : 'LUN ID', name : 'iscsi_lunid'},
    {title : 'Extent', name : 'iscsi_extent'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityList: any) {}
}
