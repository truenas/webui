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
  protected resource_name: string = 'network/interface/';
  protected route_add: string[] = [ 'network', 'interfaces', 'add' ];
  protected route_add_tooltip: string = "Add Interface";
  protected route_edit: string[] = [ 'network', 'interfaces', 'edit' ];
  protected confirmDeleteDialog = {
    message: T("Network connectivity will be interrupted. "),
  }

  public columns: Array<any> = [
    {name : T('Interface'), prop : 'int_interface'},
    {name : T('Name'), prop : 'int_name'},
    {name : T('Media Status'), prop : 'int_media_status'},
    {name : T('DHCP'), prop : 'int_dhcp'},
    {name : T('IPv6 Auto Configure'), prop: 'int_ipv6auto'},
    {name : T('IPv4 Addresses'), prop : 'ipv4_addresses'},
    {name : T('IPv6 Addresses'), prop : 'ipv6_addresses'},
    {name : T('Options'), prop: 'int_options'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Interface',
      key_props: ['int_interface']
    },
  };

  constructor(_rest: RestService, private router: Router, private networkService: NetworkService,
              private snackBar: MatSnackBar) {}

  rowValue(row, attr) {
    if (attr == 'ipv4_addresses' || attr == 'ipv6_addresses') {
      return row[attr].join(', ');
    }
    return row[attr];
  }

  doAdd() {
    this.networkService.getInterfaceNicChoices().subscribe(
      (res)=>{
        if (res.length == 0) {
          this.snackBar.open("All interfaces are already in use.", 'close', { duration: 5000 });
        } else {
          this.router.navigate(new Array('/').concat(this.route_add));
        }
      }
    )
  }
}
