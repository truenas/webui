import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-staticroute-list',
  template : `<entity-list [conf]="this"></entity-list>`
})
export class StaticRouteListComponent {

  protected resource_name: string = 'network/staticroute/';
  protected route_add: string[] = [ 'network', 'staticroutes', 'add' ];
  protected route_edit: string[] = [ 'network', 'staticroutes', 'edit' ];
  protected route_delete: string[] = [ 'network', 'staticroutes', 'delete' ];

  constructor(protected rest: RestService, protected router: Router,
              protected state: GlobalState) {}

  public columns: Array<any> = [
    {title : 'Destination', name : 'sr_destination'},
    {title : 'Gateway', name : 'sr_gateway'},
    {title : 'Description', name : 'sr_description'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
