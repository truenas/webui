import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-jail-template-list',
  template: `
  <entity-list [conf]="this"></entity-list>
  `
})
export class TemplateListComponent {

  protected resource_name: string = 'jails/templates';
  protected route_add: string[] = ['add'];
  protected route_delete: string[];
  protected route_edit: string[];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService) {}

  public columns:Array<any> = [
    {title: 'Name', name: 'jt_name'},
    {title: 'URL', name: 'jt_url'},
    {title: 'Instances', name: 'jt_instances'}
  ];

  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };
}
