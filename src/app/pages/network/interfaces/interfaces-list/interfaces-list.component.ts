import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-interfaces-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class InterfacesListComponent {

  protected resource_name: string = 'network/interface/';
  protected route_add: string[] = [ 'network', 'interfaces', 'add' ];
  protected route_add_tooltip: string = "Add Interface";
  protected route_edit: string[] = [ 'network', 'interfaces', 'edit' ];

  constructor(_rest: RestService, _router: Router) {}

  public columns: Array<any> = [
    {name : 'Interface', prop : 'int_interface'},
    {name : 'Name', prop : 'int_name'},
    {name : 'Media Status', prop : 'int_media_status'},
    {name : 'DHCP', prop : 'int_dhcp'},
    {name : 'IPv4 Addresses', prop : 'ipv4_addresses'},
    {name : 'IPv6 Addresses', prop : 'ipv6_addresses'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  rowValue(row, attr) {
    if (attr == 'ipv4_addresses' || attr == 'ipv6_addresses') {
      return row[attr].join(', ');
    }
    return row[attr];
  }
}
