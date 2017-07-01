import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'app-storage-list',
  template : `
  <entity-list [conf]="this"></entity-list>
  `
})
export class StorageListComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_add: string[] = [ 'jails', 'storage', 'add' ];
  protected route_delete: string[] = [ 'jails', 'storage', 'delete' ];
  protected route_edit: string[] = [ 'jails', 'storage', 'edit' ];

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {title : 'Jail', name : 'jail'},
    {title : 'Source', name : 'source'},
    {title : 'Destination', name : 'destination'},
    {title : 'Mounted', name : 'mounted'},
    {title : 'Read-Only', name : 'readonly'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
