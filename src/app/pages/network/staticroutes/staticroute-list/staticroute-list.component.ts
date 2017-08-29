import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-staticroute-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class StaticRouteListComponent {

  protected resource_name: string = 'network/staticroute/';
  protected route_add: string[] = [ 'network', 'staticroutes', 'add' ];
  protected route_add_tooltip: string = "Add Static Route";
  protected route_edit: string[] = [ 'network', 'staticroutes', 'edit' ];
  protected route_delete: string[] = [ 'network', 'staticroutes', 'delete' ];

  constructor(protected rest: RestService, protected router: Router) {}

  public columns: Array<any> = [
    {name : 'Destination', prop : 'sr_destination'},
    {name : 'Gateway', prop : 'sr_gateway'},
    {name : 'Description', prop : 'sr_description'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
