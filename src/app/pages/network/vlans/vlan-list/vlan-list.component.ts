import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-vlan-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class VlanListComponent {

  protected resource_name: string = 'network/vlan/';
  protected route_add: string[] = [ 'network', 'vlans', 'add' ];
  protected route_edit: string[] = [ 'network', 'vlans', 'edit' ];
  protected route_delete: string[] = [ 'network', 'vlans', 'delete' ];

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {}

  public columns: Array<any> = [
    {name : 'Vlan Interface', prop : 'vlan_vint'},
    {name : 'Parent Interface', prop : 'vlan_pint'},
    {name : 'Vlan Tag', prop : 'vlan_tag'},
    {name : 'Description', prop : 'vlan_description'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
