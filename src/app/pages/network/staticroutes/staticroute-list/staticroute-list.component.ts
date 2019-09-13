import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-staticroute-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class StaticRouteListComponent {

  public title = "Static Routes";
  protected resource_name: string = 'network/staticroute/';
  protected route_add: string[] = [ 'network', 'staticroutes', 'add' ];
  protected route_add_tooltip: string = "Add Static Route";
  protected route_edit: string[] = [ 'network', 'staticroutes', 'edit' ];

  constructor(protected rest: RestService, protected router: Router) {}

  public columns: Array<any> = [
    {name : T('Destination'), prop : 'sr_destination', always_display: true },
    {name : T('Gateway'), prop : 'sr_gateway'},
    {name : T('Description'), prop : 'sr_description'}
  ];
  public rowIdentifier = 'sr_destination';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Static Route',
      key_props: ['sr_destination']
    },
  };
}
