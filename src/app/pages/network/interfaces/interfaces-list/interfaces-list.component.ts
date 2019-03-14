import {Component} from '@angular/core';
import {Router} from '@angular/router';

import { RestService, NetworkService } from '../../../../services';
import { T } from '../../../../translate-marker';
import { MatSnackBar } from '@angular/material';

@Component({
  selector : 'app-interfaces-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class InterfacesListComponent {

  public title = "Interfaces";
  //protected resource_name: string = 'network/interface/';
  protected queryCall = 'interface.query';
  protected wsDelete = 'interface.delete';
  protected route_add: string[] = [ 'network', 'interfaces', 'add' ];
  protected route_add_tooltip: string = "Add Interface";
  protected route_edit: string[] = [ 'network', 'interfaces', 'edit' ];
  protected confirmDeleteDialog = {
    message: T("Network connectivity will be interrupted. "),
  }

  public columns: Array<any> = [
    {name : T('Name'), prop : 'name'},
    {name : T('Link State'), prop : 'link_state'},
    {name : T('DHCP'), prop : 'ipv4_dhcp'},
    {name : T('IPv6 Auto Configure'), prop: 'ipv6_auto'},
    {name : T('IP Addresses'), prop : 'addresses'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Interface',
      key_props: ['name']
    },
  };

  constructor(_rest: RestService, private router: Router, private networkService: NetworkService,
              private snackBar: MatSnackBar) {}

  /*rowValue(row, attr) {
    if (attr == 'ipv4_addresses' || attr == 'ipv6_addresses') {
      return row[attr].join(', ');
    }
    return row[attr];
  }*/

  dataHandler(res) {
    const rows = res.rows;
    console.log(rows);
    for (let i=0; i<rows.length; i++) {
      rows[i]['link_state'] = rows[i]['state']['link_state'];
      const addresses = [];
      for (let j=0; j<rows[i]['state']['aliases'].length; j++) {
        const alias = rows[i]['state']['aliases'][j];
        if (alias.type.startsWith('INET')) {
          addresses.push(alias.address);
        }
      }
      rows[i]['addresses'] = addresses.join(', ');
    }
  }

  /*doAdd() {
    this.networkService.getInterfaceNicChoices().subscribe(
      (res)=>{
        if (res.length == 0) {
          this.snackBar.open("All interfaces are already in use.", 'close', { duration: 5000 });
        } else {
          this.router.navigate(new Array('/').concat(this.route_add));
        }
      }
    )
  }*/
}
