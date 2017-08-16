import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'app-jail-template-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class TemplateListComponent {

  protected resource_name: string = 'jails/templates';
  protected route_add: string[] = [ 'jails', 'templates', 'add' ];
  protected route_add_tooltip: string = "Add Template";
  protected route_delete: string[] = [ 'jails', 'templates', 'delete' ];
  protected route_edit: string[] = [ 'jails', 'templates', 'edit' ];

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {name : 'Name', prop : 'jt_name'}, 
    {name : 'URL', prop : 'jt_url'},
    {name : 'Instances', prop : 'jt_instances'}
  ];

  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
