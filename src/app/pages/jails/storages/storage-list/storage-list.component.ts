import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'app-storage-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class StorageListComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_add: string[] = [ 'jails', 'storage', 'add' ];
  protected route_delete: string[] = [ 'jails', 'storage', 'delete' ];
  protected route_edit: string[] = [ 'jails', 'storage', 'edit' ];

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {name : 'Jail', prop : 'jail'},
    {name : 'Source', prop : 'source'},
    {name : 'Destination', prop : 'destination'},
    {name : 'Mounted', prop : 'mounted'},
    {name : 'Read-Only', prop : 'readonly'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
