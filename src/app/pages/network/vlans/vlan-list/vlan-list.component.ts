import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-vlan-list',
  template: `<entity-list [conf]="this"></entity-list>`
})
export class VlanListComponent {

  protected resource_name: string = 'network/vlan/';
  protected route_add: string[] = ['network', 'vlans', 'add'];
  protected route_edit: string[] = ['network', 'vlans', 'edit'];
  protected route_delete: string[] = ['network', 'vlans', 'delete'];

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {

  }

  public columns: Array<any> = [
    { title: 'Vlan Interface', name: 'vlan_vint' },
    { title: 'Parent Interface', name: 'vlan_pint' },
    { title: 'Vlan Tag', name: 'vlan_tag' },
    { title: 'Description', name: 'vlan_description' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

}
